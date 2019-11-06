const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

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
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client.use(plugin, window)
      client._delivery(client => ({
        sendEvent: (payload) => {
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('error')
          expect(report.unhandled).toBe(true)
          expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          plugin.destroy(window)
          done()
        }
      }))

      // simulate an UnhandledRejection event
      listener({ reason: new Error('BAD_PROMISE') })
    })

    it('handles bad user input', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client.use(plugin, window)
      client._delivery(client => ({
        sendEvent: (payload) => {
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('error')
          expect(report.unhandled).toBe(true)
          expect(report.exceptions[0].errorClass).toBe('UnhandledRejection')
          expect(report.exceptions[0].message).toBe('Rejection reason was not an Error. See "Promise" tab for more detail.')
          expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          expect(report.metaData.promise['rejection reason']).toEqual('undefined (or null)')
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
    //   client._delivery({
    //     sendEvent: (payload) => {
    //       const report = payload.events[0].toJSON()
    //       expect(report.severity).toBe('error')
    //       expect(report.unhandled).toBe(true)
    //       expect(report.exceptions[0].errorClass).toBe('AbortError')
    //       expect(report.exceptions[0].message).toBe('Subscription failed - no active Service Worker')
    //       expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
    //       expect(report.metaData.promise['rejection reason']).toEqual({
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
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client.use(plugin, window)
      client._delivery(client => ({
        sendEvent: (payload) => {
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('error')
          expect(report.unhandled).toBe(true)
          expect(report.exceptions[0].errorClass).toBe('Error')
          expect(report.exceptions[0].message).toBe('blah')
          expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
          plugin.destroy(window)
          done()
        }
      }))

      const err = new Error('blah')
      err.stack = true
      listener({ reason: err })
    })

    it('tolerates event.detail propties which throw', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client.use(plugin, window)
      client._delivery(client => ({
        sendEvent: (payload) => {
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('error')
          expect(report.unhandled).toBe(true)
          expect(report.exceptions[0].errorClass).toBe('Error')
          expect(report.exceptions[0].message).toBe('blah')
          expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
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
  })
})
