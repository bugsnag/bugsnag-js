/* eslint-disable @typescript-eslint/no-non-null-assertion */
import plugin from '../'

import { Client } from '@bugsnag/core'

class MockErrorUtils {
  _globalHandler: ((err: Error) => void) | null;

  constructor () {
    this._globalHandler = null
  }

  setGlobalHandler (h: (err: Error) => void) {
    this._globalHandler = h
  }

  getGlobalHandler () {
    return this._globalHandler
  }
}

describe('plugin: react native global error handler', () => {
  it('should set a global error handler', () => {
    const eu = new MockErrorUtils() as any
    const client = new Client({ apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', plugins: [plugin(eu)] })
    expect(typeof eu.getGlobalHandler()).toBe('function')
    expect(client).toBe(client)
  })

  it('should warn if ErrorUtils is not defined', done => {
    // @ts-expect-error Cannot find name 'global'
    const errorUtils = global.ErrorUtils
    // @ts-expect-error Cannot find name 'global'
    global.ErrorUtils = undefined
    const client = new Client({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      logger: {
        debug: () => {},
        info: () => {},
        warn: msg => {
          expect(msg).toMatch(/ErrorUtils/)
          // @ts-expect-error Cannot find name 'global'
          global.ErrorUtils = errorUtils
          done()
        },
        error: () => {}
      },
      plugins: [plugin()]
    })
    expect(client).toBe(client)
  })

  it('should not set a global error handler when autoDetectErrors=false', () => {
    const eu = new MockErrorUtils() as any
    const client = new Client({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      autoDetectErrors: false,
      plugins: [plugin(eu)]
    })
    expect(eu.getGlobalHandler()).toBe(null)
    expect(client).toBe(client)
  })

  it('should not set a global error handler when enabledErrorTypes.unhandledExceptions=false', () => {
    const eu = new MockErrorUtils() as any
    const client = new Client({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      enabledErrorTypes: { unhandledExceptions: false, unhandledRejections: false },
      plugins: [plugin(eu)]
    })
    expect(eu.getGlobalHandler()).toBe(null)
    expect(client).toBe(client)
  })

  it('should call through to an existing handler', done => {
    const eu = new MockErrorUtils() as any
    const client = new Client({ apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', plugins: [plugin(eu)] })
    client._setDelivery(client => ({
      sendSession: () => {},
      sendEvent: (payload, cb) => cb(null)
    }))
    const error = new Error('floop')
    eu.setGlobalHandler(function (err: Error, isFatal: boolean) {
      expect(err).toBe(error)
      expect(isFatal).toBe(true)
      done()
    })
    eu.getGlobalHandler()(error, true)
  })

  it('should have the correct handled state', done => {
    const eu = new MockErrorUtils()
    const client = new Client({ apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', plugins: [plugin(eu as any)] })
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
    eu._globalHandler!(new Error('argh'))
  })
})
