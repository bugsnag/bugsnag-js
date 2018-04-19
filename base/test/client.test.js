const { describe, it, expect, fail } = global

const Client = require('../client')
const Report = require('../report')
const Session = require('../session')

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
        init: (c) => {
          expect(c).toEqual(client)
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
    it('can supply a different logger via config', done => {
      const client = new Client(VALID_NOTIFIER)
      const log = (msg) => {
        expect(msg).toBeTruthy()
        done()
      }
      client.configure({
        apiKey: 'API_KEY_YEAH',
        logger: {
          debug: log,
          info: log,
          warn: log,
          error: log
        }
      })
    })
    it('is ok with a null logger', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({
        apiKey: 'API_KEY_YEAH',
        logger: null
      })
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
        sendReport: (logger, config, payload) => {
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
        sendReport: (logger, config, payload) => {
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
        sendReport: (logger, config, payload) => {
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
        sendReport: (logger, config, payload) => {
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
        sendReport: (logger, config, payload) => {
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
        sendReport: (logger, config, payload) => {
          fail('sendReport() should not be called')
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', releaseStage: 'staging', notifyReleaseStages: [ 'production' ] })

      const sent = client.notify(new Error('oh em eff gee'))
      expect(sent).toBe(false)

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('supports setting releaseStage via client.app.releaseStage', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (logger, config, payload) => {
          fail('sendReport() should not be called')
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [ 'production' ] })
      client.app.releaseStage = 'staging'

      const sent = client.notify(new Error('oh em eff gee'))
      expect(sent).toBe(false)

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('includes releaseStage in report.app', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (logger, config, payload) => {
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
        sendReport: (logger, config, payload) => {
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
        sendReport: (logger, config, payload) => {
          expect(payload.events[0].app.releaseStage).toBe('testing')
          done()
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [ 'testing' ], releaseStage: 'staging' })
      client.app.releaseStage = 'testing'
      client.notify(new Error('oh em eff gee'))
    })

    it('populates client.app.version if config.appVersion is supplied', done => {
      const client = new Client(VALID_NOTIFIER)
      client.transport({
        sendReport: (logger, config, payload) => {
          expect(payload.events[0].app.version).toBe('1.2.3')
          done()
        }
      })
      client.configure({ apiKey: 'API_KEY_YEAH', appVersion: '1.2.3' })
      client.notify(new Error('oh em eff gee'))
    })

    it('can handle all kinds of bad input', () => {
      const payloads = []
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })

      client.notify(undefined)
      client.notify(null)
      client.notify(() => {})
      client.notify(1)
      client.notify('errrororor')
      client.notify('str1', 'str2')
      client.notify('str1', null)

      payloads
        .filter((p, i) => i < 3)
        .map(p => p.events[0].toJSON().exceptions[0].message)
        .forEach(message => expect(message).toMatch(/^Bugsnag usage error/))

      expect(payloads[3].events[0].toJSON().exceptions[0].message).toBe('1')
      expect(payloads[4].events[0].toJSON().exceptions[0].message).toBe('errrororor')
      expect(payloads[5].events[0].toJSON().metaData).toEqual({ notifier: { notifyArgs: [ 'str1', 'str2' ] } })
    })

    it('supports { name, message } usage', () => {
      const payloads = []
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
      client.notify({ name: 'UnknownThing', message: 'found a thing that couldn’t be dealt with' })

      expect(payloads.length).toBe(1)
      expect(payloads[0].events[0].toJSON().exceptions[0].errorClass).toBe('UnknownThing')
      expect(payloads[0].events[0].toJSON().exceptions[0].message).toBe('found a thing that couldn’t be dealt with')
    })

    it('leaves a breadcrumb of the error', () => {
      const payloads = []
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
      client.notify(new Error('foobar'))
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0].type).toBe('error')
      expect(client.breadcrumbs[0].name).toBe('Error')
      // the error shouldn't appear as a breadcrumb for itself
      expect(payloads[0].events[0].breadcrumbs.length).toBe(0)
    })

    it('doesn’t modify global client.metaData when using updateMetaData() method', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.metaData = { foo: [ 1, 2, 3 ] }
      client.notify(new Error('changes afoot'), {
        beforeSend: (report) => {
          report.updateMetaData('foo', '3', 1)
        }
      })
      expect(client.metaData.foo['3']).toBe(undefined)
    })
  })

  describe('leaveBreadcrumb()', () => {
    it('creates a manual breadcrumb when a list of arguments are supplied', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.leaveBreadcrumb('french stick')
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0].type).toBe('manual')
      expect(client.breadcrumbs[0].name).toBe('french stick')
      expect(client.breadcrumbs[0].metaData).toEqual({})
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

    it('doesn’t add the breadcrumb if it didn’t contain anything useful', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.leaveBreadcrumb(undefined)
      client.leaveBreadcrumb(null, { data: 'is useful' })
      client.leaveBreadcrumb(null, {}, null)
      client.leaveBreadcrumb(null, { t: 10 }, null, 4)
      expect(client.breadcrumbs.length).toBe(3)
      expect(client.breadcrumbs[0].type).toBe('manual')
      expect(client.breadcrumbs[0].name).toBe('[anonymous]')
      expect(client.breadcrumbs[0].metaData).toEqual({ data: 'is useful' })
      expect(client.breadcrumbs[1].type).toBe('manual')
      expect(typeof client.breadcrumbs[2].timestamp).toBe('string')
    })

    it('allows maxBreadcrumbs to be set to 0', () => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 0 })
      client.leaveBreadcrumb('toast')
      expect(client.breadcrumbs.length).toBe(0)
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      expect(client.breadcrumbs.length).toBe(0)
    })
  })

  describe('startSession()', () => {
    it('calls the provided the session delegate and return delegate’s return value', () => {
      const client = new Client(VALID_NOTIFIER)
      let ret
      client.configure({ apiKey: 'API_KEY' })
      client.sessionDelegate({
        startSession: c => {
          expect(c).toBe(client)
          ret = {}
          return ret
        }
      })
      expect(client.startSession()).toBe(ret)
    })

    it('calls warns if a session delegate is not provided', (done) => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY' })
      client.logger({
        debug: () => {},
        info: () => {},
        warn: (...args) => {
          expect(args[0]).toMatch(/^No session/)
          done()
        },
        error: () => {}
      })
      client.startSession()
    })

    it('tracks error counts using the session delegate and sends them in error payloads', (done) => {
      const client = new Client(VALID_NOTIFIER)
      client.configure({ apiKey: 'API_KEY' })
      let i = 0
      client.sessionDelegate({
        startSession: (client) => {
          client.session = new Session()
          return client
        }
      })
      client.transport({
        sendSession: () => {},
        sendReport: (logger, config, report, cb) => {
          if (++i < 10) return
          const r = JSON.parse(JSON.stringify(report.events[0]))
          expect(r.session).toBeDefined()
          expect(r.session.events.handled).toBe(6)
          expect(r.session.events.unhandled).toBe(4)
          done()
        }
      })
      const sessionClient = client.startSession()
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Report('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Report('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Report('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient.notify(new Report('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    })
  })
})
