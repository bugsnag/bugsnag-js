// magical jasmine globals
const { describe, it, expect, beforeEach } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const url = require('url')

const onerror = require('../plugins/window-onerror')
const sessions = require('../plugins/sessions')

describe('client()', () => {
  beforeEach(() => { window.onerror = null })

  describe('caught errors', () => {
    it('should contain the name of the function that caused the error', done => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({
        sendReport: (logger, config, payload) => {
          try {
            // console.log(JSON.stringify(payload.events[0].stacktrace, null, 2))
            expect(payload.events[0].stacktrace).toBeDefined()
            expect(payload.events[0].stacktrace.map(f => f.method)[0]).toMatch(/go|c/)
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

    it('should create a stacktrace when notify({ name, message }) interface is used', done => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({
        sendReport: (logger, config, payload) => {
          try {
            // console.log(JSON.stringify(payload.events[0].stacktrace, null, 2))
            expect(payload.events[0].stacktrace).toBeDefined()
            expect(payload.events[0].stacktrace.map(f => f.method)[0]).toBe('go')
            done()
          } catch (e) {
            done(e)
          }
        }
      })
      window.bugsnag = client
      const script = document.createElement('script')
      script.src = '/fixtures/handled-error-object.js'
      window.document.body.appendChild(script)
    })
  })

  describe('uncaught errors', () => {
    it('should contain the file name of the <script> tag that caused the error', done => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.use(onerror)
      client.transport({
        sendReport: (logger, config, payload) => {
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

    it('should have all of the stackframes', done => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.use(onerror)
      client.transport({
        sendReport: (logger, config, payload) => {
          // console.log(JSON.stringify(payload.events[0].stacktrace, null, 2))
          try {
            expect(payload.events[0].stacktrace).toBeDefined()
            expect(
              payload.events[0].stacktrace
                .map(f => f.file)
                .filter(Boolean)
                .map(file => url.parse(file).pathname)
            ).toContain('/fixtures/unhandled-error-global.js')
            done()
          } catch (e) {
            done(e)
          }
        }
      })
      window.bugsnag = client
      const script = document.createElement('script')
      script.src = '/fixtures/unhandled-error-global.js'
      window.document.body.appendChild(script)
    })
  })

  describe('sessions', () => {
    it('should track sessions', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.use(sessions)
      let sessionSent = false
      let reportSent = false
      client.transport({
        sendReport: (logger, config, payload) => {
          expect(payload.events[0].session).toBeDefined()
          reportSent = true
        },
        sendSession: (logger, config, payload) => {
          expect(payload.sessions[0].startedAt).toBeDefined()
          expect(payload.sessions[0].id).toBeDefined()
          sessionSent = true
        }
      })
      client.startSession()
      expect(sessionSent).toBe(true)
      client.notify(new Error('blah'))
      expect(reportSent).toBe(true)
    })
  })
})
