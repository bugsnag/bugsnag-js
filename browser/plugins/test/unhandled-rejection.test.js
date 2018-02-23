// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../unhandled-rejection')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: unhandled rejection', () => {
  if ('onunhandledrejection' in window) {
    describe('window.onunhandledrejection function', () => {
      it('captures unhandled promise rejections', done => {
        const client = new Client(VALID_NOTIFIER)
        client.configure({ apiKey: 'API_KEY_YEAH' })
        client.use(plugin)
        client.transport({
          sendReport: (logger, config, payload) => {
            const report = payload.events[0].toJSON()
            expect(report.severity).toBe('error')
            expect(report.unhandled).toBe(true)
            expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
            plugin.destroy()
            done()
          }
        })

        setTimeout(() => Promise.reject(new Error('BAD_PROMISE')), 0)
      })

      it('handles bad user input', done => {
        const client = new Client(VALID_NOTIFIER)
        client.configure({ apiKey: 'API_KEY_YEAH' })
        client.use(plugin)
        client.transport({
          sendReport: (logger, config, payload) => {
            const report = payload.events[0].toJSON()
            expect(report.severity).toBe('error')
            expect(report.unhandled).toBe(true)
            expect(report.exceptions[0].errorClass).toBe('UnhandledRejection')
            expect(report.exceptions[0].message).toBe('Rejection reason was not an Error. See "Promise" tab for more detail.')
            expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
            expect(report.metaData.promise['rejection reason']).toEqual('undefined (or null)')
            plugin.destroy()
            done()
          }
        })

        setTimeout(() => Promise.reject(null), 0) // eslint-disable-line
      })

      it('works with DOMExceptions', done => {
        const client = new Client(VALID_NOTIFIER)
        client.configure({ apiKey: 'API_KEY_YEAH' })
        client.use(plugin)
        client.transport({
          sendReport: (logger, config, payload) => {
            const report = payload.events[0].toJSON()
            expect(report.severity).toBe('error')
            expect(report.unhandled).toBe(true)
            expect(report.exceptions[0].errorClass).toBe('AbortError')
            expect(report.exceptions[0].message).toBe('Subscription failed - no active Service Worker')
            expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
            expect(report.metaData.promise['rejection reason']).toEqual({
              '[object DOMException]': {
                name: 'AbortError',
                message: 'Subscription failed - no active Service Worker',
                code: 20,
                stack: undefined
              }
            })
            plugin.destroy()
            done()
          }
        })

        setTimeout(() =>
          navigator.serviceWorker.register('/fixtures/sw.js').then((reg) => {
            reg.pushManager.getSubscription().then(() => {})
            reg.pushManager
              .subscribe({ userVisibleOnly: true })
              .then(() => {})
          })
        , 0)
      })

      it('handles errors with non-string stacks', done => {
        const client = new Client(VALID_NOTIFIER)
        client.configure({ apiKey: 'API_KEY_YEAH' })
        client.use(plugin)
        client.transport({
          sendReport: (logger, config, payload) => {
            const report = payload.events[0].toJSON()
            expect(report.severity).toBe('error')
            expect(report.unhandled).toBe(true)
            expect(report.exceptions[0].errorClass).toBe('Error')
            expect(report.exceptions[0].message).toBe('blah')
            expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
            plugin.destroy()
            done()
          }
        })

        const err = new Error('blah')
        err.stack = true
        setTimeout(() => Promise.reject(err), 0) // eslint-disable-line
      })
    })
  }
})
