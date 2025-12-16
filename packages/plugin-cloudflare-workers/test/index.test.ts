import BugsnagPluginCloudflareWorkers from '../src/'
import Client, { EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core/client'
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

const createClient = (events: EventDeliveryPayload[], sessions: SessionDeliveryPayload[], config = {}) => {
  const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginCloudflareWorkers], ...config })

  // @ts-ignore the following property is not defined on the public Event interface
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
    // @ts-ignore
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

    expect(events).toHaveLength(1)

    const event = events[0].events[0]
    // @ts-ignore
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
})
