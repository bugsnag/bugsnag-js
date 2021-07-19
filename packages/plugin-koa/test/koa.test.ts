import Client from '@bugsnag/core/client'
import plugin from '../src/koa'
import { EventPayload } from '@bugsnag/core'
import Event from '@bugsnag/core/event'

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
    it('should start a session and attach a client to the context', async () => {
      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })

      const startSession = jest.fn().mockReturnValue(client)
      const pauseSession = jest.fn()
      const resumeSession = jest.fn().mockReturnValue(client)

      client._sessionDelegate = { startSession, pauseSession, resumeSession }
      client._logger = logger()

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
      expect(resumeSession).toHaveBeenCalledTimes(1)
      expect(context.bugsnag).toBe(client)
      expect(next).toHaveBeenCalledTimes(1)
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

      const next = jest.fn()

      await middleware.requestHandler(context, next)

      expect(next).toHaveBeenCalledTimes(1)

      const event: Event = await new Promise(resolve => {
        client.notify(new Error('abc'), noop, (_, event) => resolve(event as Event))
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

      expect(next).toHaveBeenCalledTimes(1)

      const event: Event = await new Promise(resolve => {
        client.notify(new Error('abc'), noop, (_, event) => resolve(event as Event))
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
      expect(next).toHaveBeenCalledTimes(1)

      // the Client should be cloned to ensure any manually started sessions
      // do not leak between requests
      expect(context.bugsnag).not.toBe(client)
      expect(context.bugsnag).toBeInstanceOf(Client)
    })
  })
})
