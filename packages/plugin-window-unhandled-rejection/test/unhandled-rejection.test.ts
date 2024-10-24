/* eslint-disable jest/no-commented-out-tests */
import plugin from '../src/unhandled-rejection'

import Client from '@bugsnag/core/client'

describe('plugin: unhandled rejection', () => {
  beforeEach(() => {
    jest.spyOn(window, 'addEventListener')
    jest.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function getUnhandledRejectionHandler () {
    const handler = (window.addEventListener as jest.MockedFunction<typeof window.addEventListener>).mock.calls[0][1]
    return handler as (payload: any) => void
  }

  describe('window.onunhandledrejection function', () => {
    it('captures unhandled promise rejections', done => {
      const p = plugin(window)
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [p] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          // @ts-ignore
          p.destroy(window)
          done()
        },
        sendSession: () => {}
      }))

      expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledTimes(1)

      const handler = getUnhandledRejectionHandler()
      // simulate an UnhandledRejection event
      handler({ reason: new Error('BAD_PROMISE') })
    })

    it('should report unhandledRejection events as handled when reportUnhandledPromiseRejectionsAsHandled is true', (done) => {
      const p = plugin(window)
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        reportUnhandledPromiseRejectionsAsHandled: true,
        plugins: [p]
      })

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.unhandled).toBe(false)
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          // @ts-ignore
          p.destroy(window)
          done()
        },
        sendSession: () => {}
      }))

      // simulate an UnhandledRejection event
      getUnhandledRejectionHandler()({ reason: new Error('BAD_PROMISE') })
    })

    it('handles bad user input', done => {
      expect.assertions(6)

      const p = plugin(window)
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [p] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.exceptions[0].errorClass).toBe('InvalidError')
          expect(event.exceptions[0].message).toBe('unhandledrejection handler received a non-error. See "unhandledrejection handler" tab for more detail.')
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          expect(event.metaData['unhandledrejection handler']['non-error parameter']).toEqual('null')
          // @ts-ignore
          p.destroy(window)
          done()
        },
        sendSession: () => {}
      }))

      const handler = getUnhandledRejectionHandler()

      handler({ reason: null })
    })

    // TODO: it's very difficult to mock a DOMException so move this testing to maze-runner
    //
    // it('works with DOMExceptions', done => {
    //   const client = new Client(VALID_NOTIFIER)
    // setOptions({ apiKey: 'API_KEY_YEAH' })
    //   client.configure()
    //   client.use(plugin, window)
    //   client.delivery({
    //     sendEvent: (payload) => {
    //       const event = payload.events[0].toJSON()
    //       expect(event.severity).toBe('error')
    //       expect(event.unhandled).toBe(true)
    //       expect(event.exceptions[0].errorClass).toBe('AbortError')
    //       expect(event.exceptions[0].message).toBe('Subscription failed - no active Service Worker')
    //       expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
    //       expect(event.metaData.promise['rejection reason']).toEqual({
    //         '[object DOMException]': {
    //           name: 'AbortError',
    //           message: 'Subscription failed - no active Service Worker',
    //           code: 20,
    //           stack: undefined
    //         }
    //       })
    //       plugin.destroy(window)
    //       done()
    //     }
    //   })
    //
    //   // mock a DOMException
    //   function DOMException(name, message, code) {
    //     // Error.call(this)
    //     this.name = name
    //     this.message = message
    //     this.code = code
    //     this.stack = null
    //   }
    //   DOMException.prototype = Object.create(Error.prototype)
    //
    //   listener({
    //     reason: new DOMException('AbortError', 'Subscription failed - no active Service Worker', 20)
    //   })
    // })

    it('handles errors with non-string stacks', done => {
      const p = plugin(window)
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [p] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.exceptions[0].errorClass).toBe('Error')
          expect(event.exceptions[0].message).toBe('blah')
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          // @ts-ignore
          p.destroy(window)
          done()
        },
        sendSession: () => {}
      }))

      const handler = getUnhandledRejectionHandler()

      const err = new Error('blah')
      // @ts-expect-error
      err.stack = true
      handler({ reason: err })
    })

    it('tolerates event.detail properties which throw', done => {
      const p = plugin(window)
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [p] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.exceptions[0].errorClass).toBe('Error')
          expect(event.exceptions[0].message).toBe('blah')
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          // @ts-ignore
          p.destroy(window)
          done()
        },
        sendSession: () => {}
      }))

      const handler = getUnhandledRejectionHandler()

      const err = new Error('blah')
      const detail = {}
      Object.defineProperty(detail, 'reason', {
        get: () => { throw new Error('bad accessor') }
      })
      handler({ reason: err, detail })
    })

    it('is disabled when autoDetectErrors=false', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', autoDetectErrors: false, plugins: [plugin(window)] })
      expect(window.addEventListener).toHaveBeenCalledTimes(0)
      expect(client).toBe(client)
    })

    it('is disabled when enabledErrorTypes.unhandledRejections=false', () => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        enabledErrorTypes: { unhandledExceptions: false, unhandledRejections: false },
        plugins: [plugin(window)]
      })
      expect(window.addEventListener).toHaveBeenCalledTimes(0)
      expect(client).toBe(client)
    })
  })
})
