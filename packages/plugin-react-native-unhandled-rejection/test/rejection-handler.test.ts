import plugin from '../'
import Client from '@bugsnag/core/client'
import Event from '@bugsnag/core/event'

// use the promise polyfill that RN uses, otherwise the unhandled rejections in
// this test go to node's process#unhandledRejection event
// @ts-ignore
import RnPromise from 'promise/setimmediate'

describe('plugin: react native rejection handler', () => {
  it('should hook in to the promise rejection tracker', (done) => {
    const c = new Client({ apiKey: 'api_key' })
    c._setDelivery(client => ({
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
      // @ts-ignore
      String.floop()
    } catch (e) {
      RnPromise.reject(e)
    }
    stop()
  })

  it('should be disabled when autoDetectErrors=false', (done) => {
    expect.assertions(1)

    const c = new Client({ apiKey: 'api_key', autoDetectErrors: false })
    c._setDelivery(client => ({
      sendReport: (report) => {
        expect(report).not.toBeTruthy()
      }
    }))
    const stop = plugin.init(c)
    try {
      // @ts-ignore
      String.floop()
    } catch (e) {
      RnPromise.reject(e)
    }
    stop()

    // the rejection tracker waits 100ms before reporting TypeError as unhandled
    // so be generous and wait 3x that
    setTimeout(done, 300)
  })

  it('should be disabled when autoDetectUnhandledRejections=false', (done) => {
    expect.assertions(1)

    const c = new Client({ apiKey: 'api_key', autoDetectUnhandledRejections: false })
    c._setDelivery((client: Client) => ({
      sendEvent: (payload: Event) => {
        expect(payload).not.toBeTruthy()
      }
    }))
    const stop = plugin.init(c)
    try {
      // @ts-ignore
      String.floop()
    } catch (e) {
      RnPromise.reject(e)
    }
    stop()

    // the rejection tracker waits 100ms before reporting TypeError as unhandled
    // so be generous and wait 3x that
    setTimeout(done, 300)
  })
})
