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
    const eu = new MockErrorUtils()
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(eu)] })
    expect(typeof eu.getGlobalHandler()).toBe('function')
    expect(client).toBe(client)
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
      },
      plugins: [plugin()]
    })
    expect(client).toBe(client)
  })

  it('should not set a global error handler when autoDetectErrors=false', () => {
    const eu = new MockErrorUtils()
    const client = new Client({
      apiKey: 'API_KEY_YEAH',
      autoDetectErrors: false,
      plugins: [plugin(eu)]
    })
    expect(eu.getGlobalHandler()).toBe(null)
    expect(client).toBe(client)
  })

  it('should not set a global error handler when enabledErrorTypes.unhandledExceptions=false', () => {
    const eu = new MockErrorUtils()
    const client = new Client({
      apiKey: 'API_KEY_YEAH',
      enabledErrorTypes: { unhandledExceptions: false, unhandledRejections: false },
      plugins: [plugin(eu)]
    })
    expect(eu.getGlobalHandler()).toBe(null)
    expect(client).toBe(client)
  })

  it('should call through to an existing handler', done => {
    const eu = new MockErrorUtils()
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(eu)] })
    client._setDelivery(client => ({
      sendSession: () => {},
      sendEvent: (...args) => args[args.length - 1](null)
    }))
    const error = new Error('floop')
    eu.setGlobalHandler(function (err, isFatal) {
      expect(err).toBe(error)
      expect(isFatal).toBe(true)
      done()
    })
    eu.getGlobalHandler()(error, true)
  })

  it('should have the correct handled state', done => {
    const eu = new MockErrorUtils()
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(eu)] })
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
    eu._globalHandler(new Error('argh'))
  })
})
