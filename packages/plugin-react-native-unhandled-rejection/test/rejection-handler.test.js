/* global describe, it, expect */

const plugin = require('../')
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

// use the promise polyfill that RN uses, otherwise the unhandled rejections in
// this test go to node's process#unhandledRejection event
const RnPromise = require('promise/setimmediate')

describe('plugin: react native rejection handler', () => {
  it('should hook in to the promise rejection tracker', done => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (payload) => {
        const r = JSON.parse(JSON.stringify(payload))
        expect(r).toBeTruthy()
        expect(r.events[0].severity).toBe('error')
        expect(r.events[0].severityReason).toEqual({ type: 'unhandledPromiseRejection' })
        expect(r.events[0].unhandled).toBe(true)
        done()
      }
    }))
    const stop = plugin.init(c)
    // in the interests of keeping the tests quick, TypeErrors get rejected quicker
    // see: https://github.com/then/promise/blob/d980ed01b7a383bfec416c96095e2f40fd18ab34/src/rejection-tracking.js#L48-L54
    try {
      String.floop()
    } catch (e) {
      RnPromise.reject(e)
    }
    stop()
  })

  it('should be disabled when autoDetectErrors=false', done => {
    const c = new Client({ apiKey: 'api_key', autoDetectErrors: false }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (payload) => {
        expect(payload).not.toBeTruthy()
      }
    }))
    const stop = plugin.init(c)
    try {
      String.floop()
    } catch (e) {
      RnPromise.reject(e)
    }
    stop()

    // the rejection tracker waits 100ms before payloading TypeError as unhandled
    // so be generous and wait 3x that
    setTimeout(() => done(), 300)
  })

  it('should be disabled when autoDetectUnhandledRejections=false', done => {
    const c = new Client({ apiKey: 'api_key', autoDetectUnhandledRejections: false }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (payload) => {
        expect(payload).not.toBeTruthy()
      }
    }))
    const stop = plugin.init(c)
    try {
      String.floop()
    } catch (e) {
      RnPromise.reject(e)
    }
    stop()

    // the rejection tracker waits 100ms before payloading TypeError as unhandled
    // so be generous and wait 3x that
    setTimeout(() => done(), 300)
  })
})
