/**
 * @jest-environment node
 */
import util from 'util'
import BugsnagPluginCloudflareWorkers from '../src/'
import Client, { EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core/client'

// Mock Request and Response for Node.js environment
class MockRequest {
  url: string
  method: string
  headers: Map<string, string>

  constructor (url: string, init: { method?: string, headers?: Record<string, string> } = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
  }
}

class MockResponse {
  private body: string

  constructor (body: string) {
    this.body = body
  }

  async text () {
    return this.body
  }
}

// Mock ExecutionContext for Cloudflare Workers
const createMockExecutionContext = () => {
  const promises: Promise<any>[] = []
  return {
    waitUntil: (promise: Promise<any>) => { promises.push(promise) },
    passThroughOnException: () => {},
    // Helper for tests to wait for all promises registered with waitUntil
    _waitForAllPromises: () => Promise.all(promises)
  }
}

// @ts-ignore
global.Request = MockRequest
// @ts-ignore
global.Response = MockResponse

const createClient = (events: EventDeliveryPayload[], sessions: SessionDeliveryPayload[], config = {}) => {
  const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginCloudflareWorkers], ...config })

  // @ts-ignore the following property is not defined on the public Event interface
  client.Event.__type = 'nodejs'

  // a flush failure won't throw as we don't want to crash apps if delivery takes
  // too long. To avoid the unit tests passing when this happens, we make the logger
  // throw on any 'error' log call
  client._logger.error = (...args) => { throw new Error(util.format(args)) }

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

  it('adds the request as metadata', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (request: Request, env: any, ctx: any) => new Response('Hello World!')

    const request = new Request('https://example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const env = { TEST_VAR: 'test-value' }
    const ctx = createMockExecutionContext()

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    const response = await wrappedHandler(request, env, ctx)
    expect(await response.text()).toBe('Hello World!')

    const metadata = client.getMetadata('Cloudflare Workers request')
    expect(metadata).toMatchObject({
      url: 'https://example.com/test',
      method: 'POST'
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

    const handler = async () => {
      client.notify('hello')

      return new Response('Hello World!')
    }

    const request = new Request('https://example.com/test')
    const env = {}
    const ctx = createMockExecutionContext()

    const timeoutError = new Error('flush timed out after 20ms')

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler({ flushTimeoutMs: 20 })
    const wrappedHandler = bugsnagHandler(handler)

    const response = await wrappedHandler(request, env, ctx)
    
    // Wait for promises registered with ctx.waitUntil to complete
    await ctx._waitForAllPromises().catch(() => {})
    
    expect(await response.text()).toBe('Hello World!')
    expect(client._logger.error).toHaveBeenCalledWith(`Delivery may be unsuccessful: ${timeoutError.message}`)
  })

  it('returns a wrapped handler that resolves to the original return value', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async () => new Response('Hello World!')

    const request = new Request('https://example.com/test')
    const env = {}
    const ctx = createMockExecutionContext()

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    const response = await wrappedHandler(request, env, ctx)
    expect(await response.text()).toBe('Hello World!')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('notifies when an error is thrown', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const err = new Error('badness')
    const handler = async () => {
      throw err
    }

    const request = new Request('https://example.com/test')
    const env = {}
    const ctx = createMockExecutionContext()

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    await expect(wrappedHandler(request, env, ctx)).rejects.toThrow(err)

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
    const handler = async () => {
      throw err
    }

    const request = new Request('https://example.com/test')
    const env = {}
    const ctx = createMockExecutionContext()

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    await expect(wrappedHandler(request, env, ctx)).rejects.toThrow(err)

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
    const handler = async () => {
      throw err
    }

    const request = new Request('https://example.com/test')
    const env = {}
    const ctx = createMockExecutionContext()

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    await expect(wrappedHandler(request, env, ctx)).rejects.toThrow(err)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('captures environment metadata', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async () => new Response('Hello World!')

    const request = new Request('https://example.com/test')
    const env = {
      API_KEY: 'secret-key',
      NUMERIC_VAR: 123,
      BOOLEAN_VAR: true
    }
    const ctx = createMockExecutionContext()

    const plugin = client.getPlugin('cloudflareWorkers')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    await wrappedHandler(request, env, ctx)

    const metadata = client.getMetadata('Cloudflare Workers environment')
    expect(metadata).toEqual({
      API_KEY: 'secret-key',
      NUMERIC_VAR: 123,
      BOOLEAN_VAR: true
    })
  })
})
