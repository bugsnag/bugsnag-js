const { describe, it, expect, spyOn } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')

let listener = null
const window = {
  addEventListener: (evt, handler) => {
    listener = handler
  },
  removeEventListener: () => {
    listener = null
  }
}

describe('plugin: unhandled rejection', () => {
  describe('window.onunhandledrejection function', () => {
    it('captures unhandled promise rejections', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client.use(plugin, window)
      client.delivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          plugin.destroy(window)
          done()
        }
      }))

      // simulate an UnhandledRejection event
      listener({ reason: new Error('BAD_PROMISE') })
    })

    it('handles bad user input', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client.use(plugin, window)
      client.delivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.exceptions[0].errorClass).toBe('UnhandledRejection')
          expect(event.exceptions[0].message).toBe('Rejection reason was not an Error. See "Promise" tab for more detail.')
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          expect(event.metaData.promise['rejection reason']).toEqual('undefined (or null)')
          plugin.destroy(window)
          done()
        }
      }))

      listener({ reason: null })
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
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client.use(plugin, window)
      client.delivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.exceptions[0].errorClass).toBe('Error')
          expect(event.exceptions[0].message).toBe('blah')
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          plugin.destroy(window)
          done()
        }
      }))

      const err = new Error('blah')
      err.stack = true
      listener({ reason: err })
    })

    it('tolerates event.detail propties which throw', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client.use(plugin, window)
      client.delivery(client => ({
        sendEvent: (payload) => {
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.exceptions[0].errorClass).toBe('Error')
          expect(event.exceptions[0].message).toBe('blah')
          expect(event.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          plugin.destroy(window)
          done()
        }
      }))

      const err = new Error('blah')
      const detail = {}
      Object.defineProperty(detail, 'reason', {
        get: () => { throw new Error('bad accessor') }
      })
      listener({ reason: err, detail })
    })

    it('is disabled when autoDetectErrors=false', () => {
      const window = {
        addEventListener: () => {}
      }
      const addEventListenerSpy = spyOn(window, 'addEventListener')
      const client = new Client({ apiKey: 'API_KEY_YEAH', autoDetectErrors: false })
      client.use(plugin, window)
      expect(addEventListenerSpy).toHaveBeenCalledTimes(0)
    })

    it('is disabled when autoDetectUnhandledRejections=false', () => {
      const window = {
        addEventListener: () => {}
      }
      const addEventListenerSpy = spyOn(window, 'addEventListener')
      const client = new Client({ apiKey: 'API_KEY_YEAH', autoDetectUnhandledRejections: false })
      client.use(plugin, window)
      expect(addEventListenerSpy).toHaveBeenCalledTimes(0)
    })
  })
})
