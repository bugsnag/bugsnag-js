// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect, fit } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const url = require('url')

const onerror = require('../plugins/window-onerror')

describe('client()', () => {
  describe('caught errors', () => {
    it('should contain some information resembling the source of the error', done => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({
        sendReport: (config, payload) => {
          try {
            // console.log(JSON.stringify(payload.events[0].stacktrace, null, 2))
            expect(payload.events[0].stacktrace).toBeDefined()
            expect(payload.events[0].stacktrace.map(f => f.method)).toContain('go')
            done()
          } catch (e) {
            done(e)
          }
        }
      })
      window.bugsnag = client
      const script = document.createElement('script')
      script.src = '/fixtures/handled-error.js'
      window.document.body.appendChild(script)
    })
  })

  describe('uncaught errors', () => {
    fit('should contain some information resembling the source of the error', done => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.use(onerror)
      client.transport({
        sendReport: (config, payload) => {
          // console.log(JSON.stringify(payload.events[0].stacktrace, null, 2))
          try {
            expect(payload.events[0].stacktrace).toBeDefined()
            expect(
              payload.events[0].stacktrace
                .map(f => f.file)
                .filter(Boolean)
                .map(file => url.parse(file).pathname)
            ).toContain('/fixtures/unhandled-error.js')
            done()
          } catch (e) {
            done(e)
          }
        }
      })
      window.bugsnag = client
      const script = document.createElement('script')
      script.src = '/fixtures/unhandled-error.js'
      window.document.body.appendChild(script)
    })
  })
})
