const { describe, it, expect, fail } = global

const Client = require('../client')
const Report = require('../report')
const Breadcrumb = require('../breadcrumb')

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

      const sent = client.notify(new Error('oh em eff gee'))
      expect(sent).toBe(false)

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('supports setting releaseStage via config.releaseStage', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          fail('sendReport() should not be called')
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', releaseStage: 'staging' })

      const sent = client.notify(new Error('oh em eff gee'))
      expect(sent).toBe(false)

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('supports setting releaseStage via client.app.releaseStage', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          fail('sendReport() should not be called')
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.app.releaseStage = 'staging'

      const sent = client.notify(new Error('oh em eff gee'))
      expect(sent).toBe(false)

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('includes releaseStage in report.app', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          expect(payload.events[0].app.releaseStage).toBe('staging')
          done()
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [ 'staging' ] })
      client.app.releaseStage = 'staging'
      client.notify(new Error('oh em eff gee'))
    })

    it('includes releaseStage in report.app when set via config', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          expect(payload.events[0].app.releaseStage).toBe('staging')
          done()
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [ 'staging' ], releaseStage: 'staging' })
      client.notify(new Error('oh em eff gee'))
    })

    it('prefers client.app.releaseStage over config.releaseStage', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (config, payload) => {
          expect(payload.events[0].app.releaseStage).toBe('testing')
          done()
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [ 'testing' ], releaseStage: 'staging' })
      client.app.releaseStage = 'testing'
      client.notify(new Error('oh em eff gee'))
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

  describe('leaveBreadcrumb()', () => {
    it('creates a manual breadcrumb when a list of arguments are supplied', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.leaveBreadcrumb('french stick')
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0].__isBugsnagBreadcrumb).toBe(true)
      expect(client.breadcrumbs[0].type).toBe('manual')
      expect(client.breadcrumbs[0].name).toBe('french stick')
      expect(client.breadcrumbs[0].metaData).toEqual({})
    })

    it('uses a provided breadcrumb', () => {
      const b = new Breadcrumb('log', 'bread slicing initiated', { slices: 20, width: 10 })
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.leaveBreadcrumb(b)
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toBe(b)
    })

    it('caps the length of breadcrumbs at the configured limit', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 3 })
      client.leaveBreadcrumb('malted rye')
      expect(client.breadcrumbs.length).toBe(1)
      client.leaveBreadcrumb('medium sliced white hovis')
      expect(client.breadcrumbs.length).toBe(2)
      client.leaveBreadcrumb('pumperninkel')
      expect(client.breadcrumbs.length).toBe(3)
      client.leaveBreadcrumb('seedy farmhouse')
      expect(client.breadcrumbs.length).toBe(3)
      expect(client.breadcrumbs.map(b => b.name)).toEqual([
        'medium sliced white hovis',
        'pumperninkel',
        'seedy farmhouse'
      ])
    })
  })
})
