import plugin from '../'
import Client from '@bugsnag/core/client'

// use the promise polyfill that RN uses, otherwise the unhandled rejections in
// this test go to node's process#unhandledRejection event
// @ts-ignore
import RnPromise from 'promise/setimmediate'

beforeEach(() => {
  // @ts-ignore
  global.__DEV__ = true
  jest.spyOn(console, 'warn').mockImplementation(() => { })
})

afterEach(() => {
  jest.restoreAllMocks()
  // @ts-ignore
  delete global.__DEV__
})

describe('plugin: react native rejection handler', () => {
  it('should hook in to the promise rejection tracker', (done) => {
    expect.assertions(5)

    const c = new Client({ apiKey: 'api_key' })
    c._setDelivery(client => ({
      sendEvent: (payload) => {
        const r = JSON.parse(JSON.stringify(payload))
        expect(r).toBeTruthy()
        expect(r.events[0].severity).toBe('error')
        expect(r.events[0].severityReason).toEqual({ type: 'unhandledPromiseRejection' })
        expect(r.events[0].unhandled).toBe(true)
        setTimeout(() => {
          expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Possible Unhandled Promise Rejection'))
          done()
        }, 0)
      },
      sendSession: () => { }
    }))
    const stop = plugin.load(c)
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

  it('should report unhandledRejection events as handled when reportUnhandledPromiseRejectionsAsHandled is true', (done) => {
    expect.assertions(1)

    const c = new Client({ apiKey: 'api_key', reportUnhandledPromiseRejectionsAsHandled: true })
    c._setDelivery(client => ({
      sendEvent: (payload) => {
        const r = JSON.parse(JSON.stringify(payload))
        expect(r.events[0].unhandled).toBe(false)
        done()
      },
      sendSession: () => { }
    }))
    const stop = plugin.load(c)
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

  it('should hook in to the hermes promise rejection tracker', (done) => {
    // @ts-ignore
    global.HermesInternal = {
      hasPromise: jest.fn().mockReturnValue(true),
      enablePromiseRejectionTracker: jest.fn()
    }

    expect.assertions(10)

    const c = new Client({ apiKey: 'api_key' })
    c._setDelivery(client => ({
      sendEvent: (payload) => {
        const r = JSON.parse(JSON.stringify(payload))
        expect(r).toBeTruthy()

        expect(r.events[0].exceptions[0].errorClass).toBe('Error')
        expect(r.events[0].exceptions[0].errorMessage).toBe('This is an unhandled promise')
        expect(r.events[0].exceptions[0].type).toBe('browserjs')
        expect(r.events[0].exceptions[0]).toHaveProperty('stacktrace')
        expect(r.events[0].severity).toBe('error')
        expect(r.events[0].severityReason).toEqual({ type: 'unhandledPromiseRejection' })
        expect(r.events[0].unhandled).toBe(true)
        setTimeout(() => {
          expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Possible Unhandled Promise Rejection'))

          // @ts-ignore
          delete global.HermesInternal

          done()
        })
      },
      sendSession: () => { }
    }))

    plugin.load(c)

    // @ts-ignore
    expect(global.HermesInternal.enablePromiseRejectionTracker).toHaveBeenCalledWith({
      allRejections: true,
      onUnhandled: expect.any(Function)
    })

    // @ts-ignore
    const onUnhandled = global.HermesInternal.enablePromiseRejectionTracker.mock.calls[0][0].onUnhandled
    const rejection = new Error('This is an unhandled promise')
    onUnhandled('someid', rejection)
  })

  it('should not try to hook in to hermes if not present', () => {
    // @ts-ignore
    global.HermesInternal = {
      hasPromise: jest.fn().mockReturnValue(false),
      enablePromiseRejectionTracker: jest.fn()
    }

    const c = new Client({ apiKey: 'api_key' })
    plugin.load(c)

    // @ts-ignore
    expect(global.HermesInternal?.enablePromiseRejectionTracker).not.toHaveBeenCalled()

    // @ts-ignore
    delete global.HermesInternal
  })

  it('should be disabled when autoDetectErrors=false', (done) => {
    expect.assertions(0)

    const c = new Client({ apiKey: 'api_key', autoDetectErrors: false })
    c._setDelivery(client => ({
      sendEvent: (payload) => {
        done(new Error('event should not be sent when autoDetectErrors=false'))
      },
      sendSession: () => { }
    }))
    const stop = plugin.load(c)
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

  it('should be disabled when enabledErrorTypes.unhandledRejections=false', (done) => {
    expect.assertions(0)

    const c = new Client({ apiKey: 'api_key', autoDetectErrors: true, enabledErrorTypes: { unhandledRejections: false, unhandledExceptions: true } })
    c._setDelivery((client) => ({
      sendEvent: (payload) => {
        done(new Error('event should not be sent when enabledErrorTypes.unhandledRejections=false'))
      },
      sendSession: () => { }
    }))
    const stop = plugin.load(c)
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
