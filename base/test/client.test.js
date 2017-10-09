const { describe, it, expect, fail } = global

const Client = require('../client')
const Report = require('../report')

const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('base/client', () => {
  describe('constructor', () => {
    it('can handle bad input', () => {
      expect(() => new Client()).toThrow()
      expect(() => new Client('foo')).toThrow()
    })
  })

  describe('configure()', () => {
    it('handles bad/good input', () => {
      const client = new Client(VALID_NOTIFIER)

      // no opts supplied
      expect(() => client.configure()).toThrow()
      try {
        client.configure()
      } catch (e) {
        expect(Array.isArray(e.errors)).toBe(true)
      }

      // bare minimum opts supplied
      expect(() => client.configure({ apiKey: 'API_KEY_YEAH' })).toBeDefined()
    })
  })

  describe('use()', () => {
    it('supports plugins', done => {
      const client = new Client(VALID_NOTIFIER)
      client.use({
        name: 'test plugin',
        description: 'nothing much to see here',
        init: (c, r) => {
          expect(c).toEqual(client)
          expect(r).toEqual(Report)
          done()
        }
      })
    })
  })

  describe('logger()', () => {
    it('can supply a different logger', done => {
      const client = new Client(VALID_NOTIFIER)
      const log = (msg) => {
        expect(msg).toBeTruthy()
        done()
      }
      client.logger({ debug: log, info: log, warn: log, error: log })
      client.configure({ apiKey: 'API_KEY_YEAH' })
    })
  })

  describe('notify()', () => {
    it('throws if called before configure()', () => {
      const client = new Client(VALID_NOTIFIER)
      expect(() => client.notify()).toThrow()
    })

    it('delivers an error report', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('warning')
          expect(report.severityReason).toEqual({ type: 'handledException' })
          process.nextTick(() => done())
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH' })
      const sent = client.notify(new Error('oh em gee'))
      expect(sent).toBe(true)
    })

    it('supports manually setting severity', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('error')
          expect(report.severityReason).toEqual({ type: 'userSpecifiedSeverity' })
          done()
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.notify(new Error('oh em gee'), { severity: 'error' })
    })

    it('supports setting severity via callback', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('info')
          expect(report.severityReason).toEqual({ type: 'userCallbackSetSeverity' })
          done()
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.notify(new Error('oh em gee'), {
        beforeSend: report => {
          report.severity = 'info'
        }
      })
    })

    it('supports preventing send with report.ignore() / return false', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          fail('sendReport() should not be called')
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH' })

      const sent = [
        client.notify(new Error('oh em gee'), { beforeSend: report => report.ignore() }),
        client.notify(new Error('oh em eff gee'), { beforeSend: report => false })
      ]

      expect(sent).toEqual([ false, false ])

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('supports preventing send with notifyReleaseStages', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          fail('sendReport() should not be called')
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [] })

      const sent = client.notify(new Error('oh em eff gee'), { beforeSend: report => false })
      expect(sent).toBe(false)

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('can handle all kinds of bad input', () => {
      const payloads = []
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({ sendReport: (config, payload) => payloads.push(payload) })

      client.notify(undefined)
      client.notify(null)
      client.notify(() => {})
      client.notify(1)
      client.notify('errrororor')

      payloads
        .filter((p, i) => i < 3)
        .map(p => p.events[0].toJSON().exceptions[0].message)
        .forEach(message => expect(message).toMatch(/^Bugsnag usage error/))

      expect(payloads[3].events[0].toJSON().exceptions[0].message).toBe('1')
      expect(payloads[4].events[0].toJSON().exceptions[0].message).toBe('errrororor')
    })
  })
})
