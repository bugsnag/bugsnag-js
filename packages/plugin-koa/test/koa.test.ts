import plugin from '../src/koa'
import { Client, Event, EventPayload } from '@bugsnag/core'

const noop = () => {}
const id = <T>(a: T) => a
const logger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
})

describe('plugin: koa', () => {
  it('exports two middleware functions', () => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._sessionDelegate = {
      startSession: () => c,
      pauseSession: () => {},
      resumeSession: () => c
    }

    const middleware = c.getPlugin('koa')

    if (!middleware) {
      throw new Error('getPlugin("koa") failed')
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
      client._clientContext = { run: jest.fn() }

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
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
      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)
    })

    it('should record metadata from the request', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._sessionDelegate = { startSession: id, pauseSession: noop, resumeSession: id }
      client._logger = logger()
      client._setDelivery(() => ({
        sendEvent (payload: EventPayload, cb: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          cb(null, payload.events[0])
        },
        sendSession: noop
      }))

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      const context = {
        req: {
          headers: { referer: '/abc' },
          httpVersion: '1.0',
          method: 'GET',
          url: '/xyz',
          connection: {
            remoteAddress: '123.456.789.0',
            remotePort: 9876,
            bytesRead: 192837645,
            bytesWritten: 918273465,
            address: () => ({ port: 1234, family: 'IPv4', address: '127.0.0.1' })
          }
        },
        res: {},
        request: {
          href: 'http://localhost:8080/xyz?a=1&b=2',
          query: { a: 1, b: 2 },
          body: 'the request body'
        },
        ip: '1.2.3.4'
      } as any
      client._clientContext = { run: jest.fn() }

      const next = jest.fn()

      await middleware.requestHandler(context, next)

      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)

      const event: Event = await new Promise(resolve => {
        (context.bugsnag as Client).notify(new Error('abc'), noop, (_, event) => resolve(event as Event))
      })

      expect(client._logger.warn).not.toHaveBeenCalled()
      expect(client._logger.error).not.toHaveBeenCalled()

      expect(event.request).toEqual({
        body: 'the request body',
        clientIp: '1.2.3.4',
        headers: { referer: '/abc' },
        httpMethod: 'GET',
        httpVersion: '1.0',
        url: 'http://localhost:8080/xyz?a=1&b=2',
        referer: '/abc'
      })

      expect(event._metadata.request).toEqual({
        clientIp: '1.2.3.4',
        connection: {
          remoteAddress: '123.456.789.0',
          remotePort: 9876,
          bytesRead: 192837645,
          bytesWritten: 918273465,
          localPort: 1234,
          localAddress: '127.0.0.1',
          IPVersion: 'IPv4'
        },
        headers: { referer: '/abc' },
        httpMethod: 'GET',
        httpVersion: '1.0',
        path: '/xyz',
        query: { a: 1, b: 2 },
        url: 'http://localhost:8080/xyz?a=1&b=2',
        referer: '/abc'
      })
    })

    it('should not throw when no request data is available', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._sessionDelegate = { startSession: id, pauseSession: noop, resumeSession: id }
      client._logger = logger()
      client._setDelivery(() => ({
        sendEvent (payload: EventPayload, cb: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          cb(null, payload.events[0])
        },
        sendSession: noop
      }))
      client._clientContext = { run: jest.fn() }

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      const context = {
        req: { headers: {} },
        res: {},
        request: {}
      } as any

      const next = jest.fn()

      await middleware.requestHandler(context, next)

      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)

      const event: Event = await new Promise(resolve => {
        (context.bugsnag as Client).notify(new Error('abc'), noop, (_, event) => resolve(event as Event))
      })

      expect(client._logger.warn).not.toHaveBeenCalled()
      expect(client._logger.error).not.toHaveBeenCalled()

      expect(event.request).toEqual({
        body: undefined,
        clientIp: undefined,
        headers: {},
        httpMethod: undefined,
        httpVersion: undefined,
        url: 'undefined',
        referer: undefined
      })

      expect(event._metadata.request).toEqual({
        clientIp: undefined,
        connection: undefined,
        headers: {},
        httpMethod: undefined,
        httpVersion: undefined,
        path: undefined,
        query: undefined,
        url: 'undefined',
        referer: undefined
      })
    })

    it('should not track a session when "autoTrackSessions" is disabled', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin], autoTrackSessions: false })

      const startSession = jest.fn().mockReturnValue(client)
      const pauseSession = jest.fn()
      const resumeSession = jest.fn().mockReturnValue(client)

      client._sessionDelegate = { startSession, pauseSession, resumeSession }
      client._logger = logger()
      client._clientContext = { run: jest.fn() }

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      const context = {} as any
      const next = jest.fn()

      await middleware.requestHandler(context, next)

      expect(client._logger.warn).not.toHaveBeenCalled()
      expect(client._logger.error).not.toHaveBeenCalled()
      expect(startSession).not.toHaveBeenCalled()
      expect(pauseSession).not.toHaveBeenCalled()
      expect(resumeSession).not.toHaveBeenCalled()
      expect(client._clientContext.run).toHaveBeenCalledWith(expect.any(Client), next)

      // the Client should be cloned to ensure any manually started sessions
      // do not leak between requests
      expect(context.bugsnag).not.toBe(client)
      expect(context.bugsnag).toBeInstanceOf(Client)
    })
  })

  describe('errorHandler', () => {
    it('should notify using "ctx.bugsnag" when it is defined', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._notify = jest.fn()

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      // create a separate client so we can tell which one was used by the errorHandler
      const client2 = new Client({ apiKey: 'different_api_key' })
      client2._logger = logger()

      const events: Event[] = []

      client2._setDelivery(() => ({
        sendEvent (payload: EventPayload, cb: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          events.push(payload.events[0] as Event)
        },
        sendSession: noop
      }))

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {}, bugsnag: client2 } as any

      middleware.errorHandler(error, context)

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

    it('should notify using the initial client when "ctx.bugsnag" is not defined', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._logger = logger()

      const events: Event[] = []

      client._setDelivery(() => ({
        sendEvent (payload: EventPayload, cb: (err: Error|null, obj: unknown) => void) {
          expect(payload.events).toHaveLength(1)
          events.push(payload.events[0] as Event)
        },
        sendSession: noop
      }))

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      // create a separate client so we can tell which one was used by the errorHandler
      const client2 = new Client({ apiKey: 'different_api_key' })
      client2._notify = jest.fn()

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {} } as any // no bugsnag!

      middleware.errorHandler(error, context)

      expect(client2._notify).not.toHaveBeenCalled()
      expect(client._logger.warn).toHaveBeenCalledTimes(1)
      expect(client._logger.warn).toHaveBeenCalledWith(
        'ctx.bugsnag is not defined. Make sure the @bugsnag/plugin-koa requestHandler middleware is added first.'
      )
      expect(client._logger.error).not.toHaveBeenCalled()

      expect(events).toHaveLength(1)

      const event = events[0]
      expect(event.originalError).toBe(error)
      expect(event.errors).toHaveLength(1)
      expect(event.errors[0].errorMessage).toBe('oh no!!')

      expect(event.request).toEqual({
        body: undefined,
        clientIp: undefined,
        headers: {},
        httpMethod: undefined,
        httpVersion: undefined,
        url: 'undefined',
        referer: undefined
      })

      expect(event._metadata.request).toEqual({
        clientIp: undefined,
        connection: undefined,
        headers: {},
        httpMethod: undefined,
        httpVersion: undefined,
        path: undefined,
        query: undefined,
        url: 'undefined',
        referer: undefined
      })
    })

    it('should do nothing when "autoDetectErrors" is disabled', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin], autoDetectErrors: false })
      client._notify = jest.fn()

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      const client2 = new Client({ apiKey: 'different_api_key', autoDetectErrors: false })
      client2._notify = jest.fn()

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {}, bugsnag: client2 } as any

      middleware.errorHandler(error, context)

      expect(client._notify).not.toHaveBeenCalled()
      expect(client2._notify).not.toHaveBeenCalled()

      // ensure notify is not called when using the other client
      delete context.bugsnag
      middleware.errorHandler(error, context)

      expect(client._notify).not.toHaveBeenCalled()
      expect(client2._notify).not.toHaveBeenCalled()
    })

    it('should call the app error handler when there are no other listeners', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._notify = jest.fn()

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      const app = {
        listenerCount: () => 1,
        onerror: jest.fn()
      }

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {}, bugsnag: client, app } as any

      middleware.errorHandler(error, context)

      expect(client._notify).toHaveBeenCalled()
      expect(app.onerror).toHaveBeenCalledWith(error)
    })

    it('should not call the app error handler when there are other listeners', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._notify = jest.fn()

      const middleware = client.getPlugin('koa')

      if (!middleware) {
        throw new Error('getPlugin("koa") failed')
      }

      const app = {
        listenerCount: () => 2,
        onerror: jest.fn()
      }

      const error = new Error('oh no!!')
      const context = { req: { headers: {} }, request: {}, bugsnag: client, app } as any

      middleware.errorHandler(error, context)

      expect(client._notify).toHaveBeenCalled()
      expect(app.onerror).not.toHaveBeenCalled()
    })
  })
})
