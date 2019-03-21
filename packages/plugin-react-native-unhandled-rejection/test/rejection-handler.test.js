/* global describe, it, expect */

const plugin = require('../')
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

// use the promise polyfill that RN uses, otherwise the unhandled rejections in
// this test go to node's process#unhandledRejection event
const RnPromise = require('promise/setimmediate')

describe('plugin: react native rejection handler', () => {
  it('should hook in to the promise rejection tracker', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
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

  it('should be disbaled when autoNotify=false', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key', autoNotify: false })
    c.configure()
    c.delivery(client => ({
      sendReport: (report) => {
        expect(report).not.toBeTruthy()
      }
    }))
    const stop = plugin.init(c)
    try {
      String.floop()
    } catch (e) {
      RnPromise.reject(e)
    }
    stop()

    // the rejection tracker waits 100ms before reporting TypeError as unhandled
    // so be generous and wait 3x that
    setTimeout(() => done(), 300)
  })
})
