/* global describe, it, expect */

const plugin = require('../')

const Client = require('@bugsnag/core/client')

class MockErrorUtils {
  constructor () {
    this._globalHandler = null
  }

  setGlobalHandler (h) {
    this._globalHandler = h
  }

  getGlobalHandler () {
    return this._globalHandler
  }
}

describe('plugin: react native global error handler', () => {
  it('should set a global error handler', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    const eu = new MockErrorUtils()
    client.use(plugin, eu)
    expect(typeof eu.getGlobalHandler()).toBe('function')
  })

  it('should warn if ErrorUtils is not defined', done => {
    const client = new Client({
      apiKey: 'API_KEY_YEAH',
      logger: {
        debug: () => {},
        info: () => {},
        warn: msg => {
          expect(msg).toMatch(/ErrorUtils/)
          done()
        },
        error: () => {}
      }
    })
    client.use(plugin)
  })

  it('should not set a global error handler when autoDetectErrors=false', () => {
    const client = new Client({
      apiKey: 'API_KEY_YEAH',
      autoDetectErrors: false
    })
    const eu = new MockErrorUtils()
    client.use(plugin, eu)
    expect(eu.getGlobalHandler()).toBe(null)
  })

  it('should not set a global error handler when enabledErrorTypes.unhandledExceptions=false', () => {
    const client = new Client({
      apiKey: 'API_KEY_YEAH',
      enabledErrorTypes: { unhandledExceptions: false, unhandledRejections: false }
    })
    const eu = new MockErrorUtils()
    client.use(plugin, eu)
    expect(eu.getGlobalHandler()).toBe(null)
  })

  it('should call through to an existing handler', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    client._setDelivery(client => ({
      sendSession: () => {},
      sendEvent: (...args) => args[args.length - 1](null)
    }))
    const eu = new MockErrorUtils()
    const error = new Error('floop')
    eu.setGlobalHandler(function (err, isFatal) {
      expect(err).toBe(error)
      expect(isFatal).toBe(true)
      done()
    })
    client.use(plugin, eu)
    eu.getGlobalHandler()(error, true)
  })

  it('should have the correct handled state', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    client._setDelivery(client => ({
      sendSession: () => {},
      sendEvent: (payload, cb) => {
        const r = JSON.parse(JSON.stringify(payload))
        expect(r.events[0].severity).toBe('error')
        expect(r.events[0].unhandled).toBe(true)
        expect(r.events[0].severityReason).toEqual({ type: 'unhandledException' })
        done()
      }
    }))
    const eu = new MockErrorUtils()
    client.use(plugin, eu)
    eu._globalHandler(new Error('argh'))
  })
})
