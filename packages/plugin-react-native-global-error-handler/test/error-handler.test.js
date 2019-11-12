/* global describe, it, expect */

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

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
    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    const eu = new MockErrorUtils()
    client.use(plugin, eu)
    expect(typeof eu.getGlobalHandler()).toBe('function')
  })

  it('should warn if ErrorUtils is not defined', done => {
    const client = new Client(VALID_NOTIFIER)
    client.setOptions({
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
    client.configure()
    client.use(plugin)
  })

  it('should call through to an exising handler', done => {
    const client = new Client(VALID_NOTIFIER)
    client.delivery(client => ({
      sendSession: () => {},
      sendReport: (...args) => args[args.length - 1](null)
    }))
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
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
    const client = new Client(VALID_NOTIFIER)
    client.delivery(client => ({
      sendSession: () => {},
      sendReport: (report, cb) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r.events[0].severity).toBe('error')
        expect(r.events[0].unhandled).toBe(true)
        expect(r.events[0].severityReason).toEqual({ type: 'unhandledException' })
        done()
      }
    }))
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    const eu = new MockErrorUtils()
    client.use(plugin, eu)
    eu._globalHandler(new Error('argh'))
  })
})
