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
        const payloads = []
        client.configure({ apiKey: 'API_KEY_YEAH' })
        client.use(plugin)
        client.transport({ sendReport: (config, payload) => payloads.push(payload) })

        setTimeout(() => {
          Promise.reject(new Error('BAD_PROMISE'))
        }, 0)

        setTimeout(() => {
          try {
            expect(payloads.length).toBe(1)
            const report = payloads[0].events[0].toJSON()
            expect(report.severity).toBe('error')
            expect(report.unhandled).toBe(true)
            expect(report.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
            done()
          } catch (e) {
            done(e)
          }
        }, 50)
      })
    })
  }
})
