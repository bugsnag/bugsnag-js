import plugin from '../src/hono'
import { Client } from '@bugsnag/core'
import type { EventDeliveryPayload, Event } from '@bugsnag/core'

jest.mock('../src/load-connection-info', () => {
  return jest.fn().mockResolvedValueOnce({
    remote: { address: '1.2.3.4', addressType: 'v4', port: '1234' }
  }).mockResolvedValueOnce(null)
})

const noop = () => {}
const id = <T>(a: T) => a
const logger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
})

describe('plugin: hono', () => {
  it('exports two middleware functions', () => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._sessionDelegate = {
      startSession: () => c,
      pauseSession: () => {},
      resumeSession: () => c
    }

    const middleware = c.getPlugin('hono')

    if (!middleware) {
      throw new Error('getPlugin("hono") failed')
    }

    expect(typeof middleware.requestHandler).toBe('function')
    expect(middleware.requestHandler.length).toBe(2)
    expect(typeof middleware.errorHandler).toBe('function')
    expect(middleware.errorHandler.length).toBe(2)
  })

  describe('requestHandler', () => {
    it('should clone the client, start a session and attach the cloned client to the context', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })

      const startSession = jest.fn().mockReturnValue(client)
      const pauseSession = jest.fn()
      const resumeSession = jest.fn().mockReturnValue(client)

      client._sessionDelegate = { startSession, pauseSession, resumeSession }
      client._logger = logger()
      // @ts-expect-error _clientContext is not part of the public API
      client._clientContext = { run: jest.fn() }

      const middleware = client.getPlugin('hono')

      if (!middleware) {
        throw new Error('getPlugin("hono") failed')
      }

      const context = {} as any
      const next = jest.fn()

      await middleware.requestHandler(context, next)

      expect(client._logger.warn).not.toHaveBeenCalled()
      expect(client._logger.error).not.toHaveBeenCalled()
      expect(startSession).toHaveBeenCalledTimes(1)
      expect(pauseSession).not.toHaveBeenCalled()
      expect(resumeSession).not.toHaveBeenCalled()
      expect(context.bugsnag).toStrictEqual(expect.any(Client))
      expect(context.bugsnag).not.toBe(client)
      // @ts-expect-error _clientContext is not part of the public API
      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)
    })

    it('should record metadata from the request with connection information if available', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._sessionDelegate = { startSession: id, pauseSession: noop, resumeSession: id }
      client._logger = logger()
      client._setDelivery(() => ({
        sendEvent (payload: EventDeliveryPayload, c: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          c(null, payload.events[0])
        },
        sendSession: noop
      }))

      const middleware = client.getPlugin('hono')

      if (!middleware) {
        throw new Error('getPlugin("hono") failed')
      }

      const context = {
        req: {
          method: 'GET',
          url: 'http://localhost:8080/xyz?a=1&b=2',
          path: '/xyz'
        },
        res: {},
        env: { outgoing: { req: { httpVersion: '1.1' } } }
      } as any
      // @ts-expect-error _clientContext is not part of the public API
      client._clientContext = { run: jest.fn() }
      context.req.parseBody = jest.fn().mockReturnValue('the request body')
      context.req.header = jest.fn().mockReturnValue({ referer: '/abc' })
      context.req.query = jest.fn().mockReturnValue({ a: 1, b: 2 })
      context.req.param = jest.fn()

      const next = jest.fn()

      await middleware.requestHandler(context, next)

      // @ts-expect-error _clientContext is not part of the public API
      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)

      const event: Event = await new Promise(resolve => {
        (context.bugsnag as Client).notify(new Error('abc'), noop, (_, event) => resolve(event as Event))
      })

      expect(client._logger.warn).not.toHaveBeenCalled()
      expect(client._logger.error).not.toHaveBeenCalled()

      expect(event.request).toEqual({
        body: 'the request body',
        headers: { referer: '/abc' },
        httpMethod: 'GET',
        url: 'http://localhost:8080/xyz?a=1&b=2',
        httpVersion: '1.1'
      })

      expect(event._metadata.request).toEqual({
        headers: { referer: '/abc' },
        httpMethod: 'GET',
        path: '/xyz',
        query: { a: 1, b: 2 },
        url: 'http://localhost:8080/xyz?a=1&b=2',
        httpVersion: '1.1',
        connection: {
          remoteAddress: '1.2.3.4',
          IPVersion: 'v4',
          remotePort: '1234'
        },
        clientIp: '1.2.3.4'
      })
    })

    it('should record metadata from the request when there is no connection information available', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._sessionDelegate = { startSession: id, pauseSession: noop, resumeSession: id }
      client._logger = logger()
      client._setDelivery(() => ({
        sendEvent (payload: EventDeliveryPayload, c: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          c(null, payload.events[0])
        },
        sendSession: noop
      }))

      const middleware = client.getPlugin('hono')

      if (!middleware) {
        throw new Error('getPlugin("hono") failed')
      }

      const context = {
        req: {
          method: 'GET',
          url: 'http://localhost:8080/xyz?a=1&b=2',
          path: '/xyz'
        },
        res: {},
        env: { outgoing: { req: { httpVersion: '1.1' } } }
      } as any
      // @ts-expect-error _clientContext is not part of the public API
      client._clientContext = { run: jest.fn() }
      context.req.parseBody = jest.fn().mockReturnValue('the request body')
      context.req.header = jest.fn().mockReturnValue({ referer: '/abc' })
      context.req.query = jest.fn().mockReturnValue({ a: 1, b: 2 })
      context.req.param = jest.fn()

      const next = jest.fn()

      await middleware.requestHandler(context, next)

      // @ts-expect-error _clientContext is not part of the public API
      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)

      const event: Event = await new Promise(resolve => {
        (context.bugsnag as Client).notify(new Error('abc'), noop, (_, event) => resolve(event as Event))
      })

      expect(client._logger.warn).not.toHaveBeenCalled()
      expect(client._logger.error).not.toHaveBeenCalled()

      expect(event.request).toEqual({
        body: 'the request body',
        headers: { referer: '/abc' },
        httpMethod: 'GET',
        url: 'http://localhost:8080/xyz?a=1&b=2',
        httpVersion: '1.1'
      })

      expect(event._metadata.request).toEqual({
        headers: { referer: '/abc' },
        httpMethod: 'GET',
        path: '/xyz',
        query: { a: 1, b: 2 },
        url: 'http://localhost:8080/xyz?a=1&b=2',
        httpVersion: '1.1'
      })
    })

    it('should not track a session when "autoTrackSessions" is disabled', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin], autoTrackSessions: false })

      const startSession = jest.fn().mockReturnValue(client)
      const pauseSession = jest.fn()
      const resumeSession = jest.fn().mockReturnValue(client)

      client._sessionDelegate = { startSession, pauseSession, resumeSession }
      client._logger = logger()
      // @ts-expect-error _clientContext is not part of the public API
      client._clientContext = { run: jest.fn() }

      const middleware = client.getPlugin('hono')

      if (!middleware) {
        throw new Error('getPlugin("hono") failed')
      }

      const context = {} as any
      const next = jest.fn()

      await middleware.requestHandler(context, next)

      expect(client._logger.warn).not.toHaveBeenCalled()
      expect(client._logger.error).not.toHaveBeenCalled()
      expect(startSession).not.toHaveBeenCalled()
      expect(pauseSession).not.toHaveBeenCalled()
      expect(resumeSession).not.toHaveBeenCalled()
      // @ts-expect-error _clientContext is not part of the public API
      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)

      // the Client should be cloned to ensure any manually started sessions
      // do not leak between requests
      expect(context.bugsnag).not.toBe(client)
      expect(context.bugsnag).toBeInstanceOf(Client)
    })
  })
  describe('errorHandler', () => {
    it('should notify using "c.bugsnag" when it is defined', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._notify = jest.fn()

      const middleware = client.getPlugin('hono')

      if (!middleware) {
        throw new Error('getPlugin("hono") failed')
      }

      // create a separate client so we can tell which one was used by the errorHandler
      const client2 = new Client({ apiKey: 'different_api_key' })
      client2._logger = logger()

      const events: Event[] = []

      client2._setDelivery(() => ({
        sendEvent (payload: EventDeliveryPayload, c: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          events.push(payload.events[0] as Event)
        },
        sendSession: noop
      }))

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {}, bugsnag: client2, error: error } as any
      const next = jest.fn()

      await middleware.errorHandler(context, next)

      expect(client._notify).not.toHaveBeenCalled()
      expect(client2._logger.warn).not.toHaveBeenCalled()
      expect(client2._logger.error).not.toHaveBeenCalled()

      expect(events).toHaveLength(1)

      const event = events[0]
      expect(event.originalError).toBe(error)
      expect(event.errors).toHaveLength(1)
      expect(event.errors[0].errorMessage).toBe('oh no!!')

      // these values should come from the requestHandler's onError callback, so we
      // expect them to be undefined in this test as we never call the requestHandler
      expect(event.request).toEqual({})
      expect(event._metadata.request).toBeUndefined()
    })

    it('should notify using the initial client when "c.bugsnag" is not defined', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._logger = logger()

      const events: Event[] = []

      client._setDelivery(() => ({
        sendEvent (payload: EventDeliveryPayload, c: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          events.push(payload.events[0] as Event)
        },
        sendSession: noop
      }))

      const middleware = client.getPlugin('hono')

      if (!middleware) {
        throw new Error('getPlugin("hono") failed')
      }

      // create a separate client so we can tell which one was used by the errorHandler
      const client2 = new Client({ apiKey: 'different_api_key' })
      client2._notify = jest.fn()

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {}, env: { outgoing: { req: {} } }, error: error } as any // no bugsnag!
      context.req.parseBody = jest.fn()
      context.req.header = jest.fn()
      context.req.param = jest.fn()
      context.req.query = jest.fn()
      const next = jest.fn()

      await middleware.errorHandler(context, next)

      expect(client2._notify).not.toHaveBeenCalled()
      expect(client._logger.warn).toHaveBeenCalledTimes(1)
      expect(client._logger.warn).toHaveBeenCalledWith(
        'c.bugsnag is not defined. Make sure the @bugsnag/plugin-hono requestHandler middleware is added first.'
      )
      expect(client._logger.error).not.toHaveBeenCalled()

      expect(events).toHaveLength(1)

      const event = events[0]
      expect(event.originalError).toBe(error)
      expect(event.errors).toHaveLength(1)
      expect(event.errors[0].errorMessage).toBe('oh no!!')

      expect(event.request).toEqual({
        body: undefined,
        headers: undefined,
        httpMethod: undefined,
        url: undefined
      })

      expect(event._metadata.request).toEqual({
        body: undefined,
        headers: undefined,
        params: undefined,
        path: undefined,
        httpMethod: undefined,
        routePath: undefined,
        url: undefined
      })
    })

    it('should do nothing when "autoDetectErrors" is disabled', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin], autoDetectErrors: false })
      client._notify = jest.fn()

      const middleware = client.getPlugin('hono')

      if (!middleware) {
        throw new Error('getPlugin("hono") failed')
      }

      const client2 = new Client({ apiKey: 'different_api_key', autoDetectErrors: false })
      client2._notify = jest.fn()

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {}, bugsnag: client2, error: error } as any
      const next = jest.fn()

      middleware.errorHandler(context, next)

      expect(client._notify).not.toHaveBeenCalled()
      expect(client2._notify).not.toHaveBeenCalled()

      // ensure notify is not called when using the other client
      delete context.bugsnag
      middleware.errorHandler(context, next)

      expect(client._notify).not.toHaveBeenCalled()
      expect(client2._notify).not.toHaveBeenCalled()
    })
  })
})
