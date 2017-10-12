// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('client()', () => {
  describe('caught errors', () => {
    it('should contain some information resembling the source of the error', done => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({
        sendReport: (config, payload) => {
          // console.log(JSON.stringify(payload.events[0].stacktrace, null, 2))
          expect(payload.events[0].stacktrace).toBeDefined()
          expect(payload.events[0].stacktrace.map(f => f.method)).toContain('go')
          done()
        }
      })
      window.bugsnag = client
      const script = document.createElement('script')
      script.src = '/fixtures/handled-error.js'
      window.document.body.appendChild(script)
    })
  })

})
