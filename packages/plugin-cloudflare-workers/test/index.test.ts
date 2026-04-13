import BugsnagPluginCloudflareWorkers from '../src/'
import { Client, EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core'
import type { Request as CloudflareRequest, Response as CloudflareResponse, ExecutionContext, ExportedHandler, IncomingRequestCfProperties } from '@cloudflare/workers-types'

// Extended ExecutionContext type for testing with helper method
interface MockExecutionContext extends ExecutionContext {
  _waitForAllPromises: () => Promise<any[]>
}

// Example Env interface for testing type inference
interface Env {
  SOME_VALUE?: string
}

// Mock ExecutionContext for Cloudflare Workers
const createMockExecutionContext = (): MockExecutionContext => {
  const promises: Array<Promise<any>> = []
  return {
    waitUntil: (promise: Promise<any>) => { promises.push(promise) },

    // Helper for tests to wait for all promises registered with waitUntil
    _waitForAllPromises: () => Promise.all(promises)
  } as unknown as MockExecutionContext
}

const createClient = (events: EventDeliveryPayload[], sessions: SessionDeliveryPayload[], config = {}, additionalPlugins: any[] = []) => {
  const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginCloudflareWorkers, ...additionalPlugins], ...config })

  // @ts-expect-error the following property is not defined on the public Event interface
  client.Event.__type = 'nodejs'

  client._delivery = {
    sendEvent (payload, cb = () => {}) {
      events.push(payload)
      cb()
    },
    sendSession (payload, cb = () => {}) {
      sessions.push(payload)
      cb()
    }
  }

  // Mock _clientContext.run to execute the callback immediately
  // This simulates AsyncLocalStorage behavior for testing
  client._clientContext = {
    run: jest.fn((requestClient, callback) => callback())
  }

  return client
}

describe('plugin: cloudflare workers', () => {
  it('has a name', () => {
    expect(BugsnagPluginCloudflareWorkers.name).toBe('cloudflareWorkers')

    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginCloudflareWorkers] })
    const plugin = client.getPlugin('cloudflareWorkers')

    expect(plugin).toBeTruthy()
  })

  it('exports a "createHandler" function', () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginCloudflareWorkers] })
    const plugin = client.getPlugin('cloudflareWorkers')

    expect(plugin).toMatchObject({ createHandler: expect.any(Function) })
  })

  it('adds the request as metadata when an error occurs', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const err = new Error('test error')

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler(async (request, env, ctx) => {
        throw err
      })
    }

    const request = new Request('https://example.com/test?foo=bar&baz=qux', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cf-Connecting-IP': '203.0.113.1'
      }
    }) as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {}
    const ctx = createMockExecutionContext()

    await expect(exportedHandler.fetch?.(request, env, ctx)).rejects.toThrow(err)

    // Wait for promises registered with ctx.waitUntil to complete
    await ctx._waitForAllPromises()

    // Verify _clientContext.run was called with a cloned client
    expect(client._clientContext.run).toHaveBeenCalledTimes(1)
    expect(client._clientContext.run).toHaveBeenCalledWith(
      expect.any(Client),
      expect.any(Function)
    )

    expect(events).toHaveLength(1)

    const event = events[0].events[0]
    expect(event.request).toMatchObject({
      url: 'https://example.com/test?foo=bar&baz=qux',
      httpMethod: 'POST',
      clientIp: '203.0.113.1',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.1'
      }
    })
    // @ts-expect-error _metadata is a private property on Event
    expect(event._metadata?.request).toMatchObject({
      url: 'https://example.com/test?foo=bar&baz=qux',
      path: '/test',
      httpMethod: 'POST',
      clientIp: '203.0.113.1',
      query: {
        foo: 'bar',
        baz: 'qux'
      },
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.1'
      }
    })
  })

  it('logs an error if flush times out', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginCloudflareWorkers] })
    client._logger.error = jest.fn()

    client._delivery = {
      sendEvent (payload, cb = () => {}) {
        setTimeout(cb, 250)
      },
      sendSession (payload, cb = () => {}) {
        setTimeout(cb, 250)
      }
    }

    // Mock _clientContext.run to execute the callback immediately
    client._clientContext = {
      run: jest.fn((requestClient, callback) => callback())
    }

    const timeoutError = new Error('flush timed out after 20ms')

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler({ flushTimeoutMs: 20 })

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler((request, env, ctx) => {
        client.notify('hello')
        return new Response('Hello World!') as unknown as CloudflareResponse
      })
    }

    const request = new Request('https://example.com/test') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {}
    const ctx = createMockExecutionContext()

    const response = await exportedHandler.fetch?.(request, env, ctx)

    // Wait for promises registered with ctx.waitUntil to complete
    await ctx._waitForAllPromises().catch(() => {})

    expect(await response?.text()).toBe('Hello World!')
    expect(client._logger.error).toHaveBeenCalledWith(`Delivery may be unsuccessful: ${timeoutError.message}`)
  })

  it('returns a wrapped handler that resolves to the original return value', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler(async (request, env, ctx) => {
        // Access env property to verify type inference works correctly
        const value = env.SOME_VALUE
        return new Response(`Hello World! ${value}`) as unknown as CloudflareResponse
      })
    }

    const request = new Request('https://example.com/test') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {
      SOME_VALUE: 'test value'
    }
    const ctx = createMockExecutionContext()

    const response = await exportedHandler.fetch?.(request, env, ctx)
    expect(await response?.text()).toBe('Hello World! test value')

    // Verify _clientContext.run was called
    expect(client._clientContext.run).toHaveBeenCalledTimes(1)
    expect(client._clientContext.run).toHaveBeenCalledWith(
      expect.any(Client),
      expect.any(Function)
    )

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('notifies when an error is thrown', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const err = new Error('badness')

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler(async (request, env, ctx) => {
        throw err
      })
    }

    const request = new Request('https://example.com/test') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {}
    const ctx = createMockExecutionContext()

    await expect(exportedHandler.fetch?.(request, env, ctx)).rejects.toThrow(err)

    // Wait for promises registered with ctx.waitUntil to complete
    await ctx._waitForAllPromises()

    // Verify _clientContext.run was called
    expect(client._clientContext.run).toHaveBeenCalledTimes(1)

    expect(events).toHaveLength(1)

    const event = events[0].events[0]
    // @ts-expect-error errors property not on public Event type
    expect(event.errors[0].errorMessage).toBe('badness')
    expect(event.unhandled).toBe(true)

    expect(sessions).toHaveLength(1)
  })

  it('does not notify when autoDetectErrors=false', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, { autoDetectErrors: false })

    const err = new Error('badness')

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler(async (request, env, ctx) => {
        throw err
      })
    }

    const request = new Request('https://example.com/test') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {}
    const ctx = createMockExecutionContext()

    await expect(exportedHandler.fetch?.(request, env, ctx)).rejects.toThrow(err)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('does not notify when enabledErrorTypes.unhandledExceptions=false', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, {
      enabledErrorTypes: {
        unhandledExceptions: false,
        unhandledRejections: true
      }
    })

    const err = new Error('badness')

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler(async (request, env, ctx) => {
        throw err
      })
    }

    const request = new Request('https://example.com/test') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {}
    const ctx = createMockExecutionContext()

    await expect(exportedHandler.fetch?.(request, env, ctx)).rejects.toThrow(err)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('clones the client for each request to avoid callback accumulation', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler(async (request, env, ctx) => {
        throw new Error('Test error')
      })
    }

    const request1 = new Request('https://example.com/request1?param1=value1', {
      method: 'GET',
      headers: {
        'X-Custom-Header': 'request1'
      }
    }) as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const request2 = new Request('https://example.com/request2?param2=value2', {
      method: 'POST',
      headers: {
        'X-Custom-Header': 'request2'
      }
    }) as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {}
    const ctx1 = createMockExecutionContext()
    const ctx2 = createMockExecutionContext()

    // Make two requests (both will throw errors)
    await expect(exportedHandler.fetch?.(request1, env, ctx1)).rejects.toThrow('Test error')
    await expect(exportedHandler.fetch?.(request2, env, ctx2)).rejects.toThrow('Test error')

    // Wait for promises registered with ctx.waitUntil to complete
    await ctx1._waitForAllPromises()
    await ctx2._waitForAllPromises()

    // Verify _clientContext.run was called twice with different cloned clients
    expect(client._clientContext.run).toHaveBeenCalledTimes(2)

    const firstCallClient = (client._clientContext.run as jest.Mock).mock.calls[0][0]
    const secondCallClient = (client._clientContext.run as jest.Mock).mock.calls[1][0]

    // Both should be Client instances but different instances
    expect(firstCallClient).toBeInstanceOf(Client)
    expect(secondCallClient).toBeInstanceOf(Client)
    expect(firstCallClient).not.toBe(secondCallClient)
    expect(firstCallClient).not.toBe(client)
    expect(secondCallClient).not.toBe(client)

    // Both requests should have started sessions
    expect(sessions).toHaveLength(2)

    // Verify two events were sent
    expect(events).toHaveLength(2)

    // Verify first event has correct request metadata
    const event1 = events[0].events[0]
    expect(event1.request).toMatchObject({
      url: 'https://example.com/request1?param1=value1',
      httpMethod: 'GET',
      headers: expect.objectContaining({
        'x-custom-header': 'request1'
      })
    })
    // @ts-expect-error _metadata is a private property on Event
    expect(event1._metadata?.request).toMatchObject({
      url: 'https://example.com/request1?param1=value1',
      path: '/request1',
      httpMethod: 'GET',
      query: {
        param1: 'value1'
      },
      headers: expect.objectContaining({
        'x-custom-header': 'request1'
      })
    })

    // Verify second event has correct request metadata
    const event2 = events[1].events[0]
    expect(event2.request).toMatchObject({
      url: 'https://example.com/request2?param2=value2',
      httpMethod: 'POST',
      headers: expect.objectContaining({
        'x-custom-header': 'request2'
      })
    })
    // @ts-expect-error _metadata is a private property on Event
    expect(event2._metadata?.request).toMatchObject({
      url: 'https://example.com/request2?param2=value2',
      path: '/request2',
      httpMethod: 'POST',
      query: {
        param2: 'value2'
      },
      headers: expect.objectContaining({
        'x-custom-header': 'request2'
      })
    })
  })

  it('resets app duration plugin between requests', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    // Mock the app duration plugin
    const mockReset = jest.fn()
    const mockAppDurationPlugin = {
      name: 'appDuration',
      load: () => ({
        reset: mockReset
      })
    }

    const client = createClient(events, sessions, {}, [mockAppDurationPlugin])

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()

    const exportedHandler: ExportedHandler<Env> = {
      fetch: bugsnagHandler(async (request, env, ctx) => {
        return new Response('OK') as unknown as CloudflareResponse
      })
    }

    const request1 = new Request('https://example.com/request1') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const request2 = new Request('https://example.com/request2') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const request3 = new Request('https://example.com/request3') as unknown as CloudflareRequest<unknown, IncomingRequestCfProperties<unknown>>
    const env = {}
    const ctx1 = createMockExecutionContext()
    const ctx2 = createMockExecutionContext()
    const ctx3 = createMockExecutionContext()

    // Make three requests
    await exportedHandler.fetch?.(request1, env, ctx1)
    await exportedHandler.fetch?.(request2, env, ctx2)
    await exportedHandler.fetch?.(request3, env, ctx3)

    // Wait for all promises to complete
    await ctx1._waitForAllPromises()
    await ctx2._waitForAllPromises()
    await ctx3._waitForAllPromises()

    // Verify reset was called for each request
    expect(mockReset).toHaveBeenCalledTimes(3)
  })
})
