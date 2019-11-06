const { describe, it, expect, fail, spyOn } = global

const Client = require('../client')
const Event = require('../event')
const Session = require('../session')

const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('@bugsnag/core/client', () => {
  describe('constructor', () => {
    it('can handle bad input', () => {
      expect(() => new Client()).toThrow()
      expect(() => new Client('foo')).toThrow()
    })
  })

  describe('use()', () => {
    it('supports plugins', () => {
      const client = new Client({ apiKey: '123' }, undefined, VALID_NOTIFIER)
      const p = {}
      client.use({
        name: 'test plugin',
        init: (c) => {
          expect(c).toEqual(client)
          return p
        }
      })
      expect(client.getPlugin('test plugin')).toBe(p)
    })

    it('supports plugins that define their own config schema', () => {
      const client = new Client({ apiKey: '123', testPluginSeed: 1 }, undefined, VALID_NOTIFIER)
      const p = {}
      client.use({
        init: (c) => {
          expect(c).toEqual(client)
          return p
        },
        configSchema: {
          testPluginSeed: {
            message: 'should be a number',
            validate: val => typeof val === 'number',
            defaultValue: () => 1
          }
        }
      })
      expect(client._config.testPluginSeed).toBe(1)
    })
  })

  describe('_logger()', () => {
    it('can supply a different logger', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const log = (msg) => {
        expect(msg).toBeTruthy()
        done()
      }
      client._logger({ debug: log, info: log, warn: log, error: log })
      client.__logger.debug('hey')
    })

    it('can supply a different logger via config', done => {
      const log = (msg) => {
        expect(msg).toBeTruthy()
        done()
      }
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        logger: {
          debug: log,
          info: log,
          warn: log,
          error: log
        }
      }, undefined, VALID_NOTIFIER)
      client.__logger.debug('hey')
    })

    it('is ok with a null logger', () => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        logger: null
      }, undefined, VALID_NOTIFIER)
      client.__logger.debug('hey')
    })
  })

  describe('notify()', () => {
    it('delivers an error report', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendEvent: payload => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('warning')
          expect(report.severityReason).toEqual({ type: 'handledException' })
          process.nextTick(() => done())
        }
      }))
      client.notify(new Error('oh em gee'))
    })

    it('supports setting severity via callback', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendEvent: (payload) => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)
          const report = payload.events[0].toJSON()
          expect(report.severity).toBe('info')
          expect(report.severityReason).toEqual({ type: 'userCallbackSetSeverity' })
          done()
        }
      }))
      client.notify(new Error('oh em gee'), event => {
        event.severity = 'info'
      })
    })

    it('supports preventing send with OnError returning false', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendEvent: (payload) => {
          fail('sendEvent() should not be called')
        }
      }))

      client.notify(new Error('oh wow'), event => false)

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('doesn’t prevent send when enabledReleaseStages is empty', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledReleaseStages: [] }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendEvent: (payload) => {
          done()
        }
      }))

      client.notify(new Error('oh wow'))
    })

    it('supports preventing send when releaseStage is not it enabledReleaseStages', done => {
      const client = new Client(
        {
          apiKey: 'API_KEY_YEAH',
          releaseStage: 'staging',
          enabledReleaseStages: ['production']
        },
        undefined,
        VALID_NOTIFIER
      )
      client._delivery(client => ({
        sendEvent: (payload) => {
          fail('sendEvent() should not be called')
        }
      }))

      client.notify(new Error('oh wow'))

      // give the event loop a tick to see if the reports get send
      process.nextTick(() => done())
    })

    it('includes releaseStage in event.app', done => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH', enabledReleaseStages: ['staging'], releaseStage: 'staging' },
        undefined,
        VALID_NOTIFIER
      )
      client._delivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].app.releaseStage).toBe('staging')
          done()
        }
      }))
      client.notify(new Error('oh wow'))
    })

    it('populates event.app.version if config.appVersion is supplied', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', appVersion: '1.2.3' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].app.version).toBe('1.2.3')
          done()
        }
      }))
      client.notify(new Error('oh wow'))
    })

    it('can handle all kinds of bad input', done => {
      const payloads = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({ sendEvent: (payload, cb) => { payloads.push(payload); cb() } }))

      client.notify(undefined)
      client.notify(null)
      client.notify(() => {})
      client.notify({ name: 'some message' })
      client.notify(1)
      client.notify('errrororor')
      client.notify('str1', 'str2')
      client.notify('str1', null)

      setTimeout(() => {
        expect(payloads[0].events[0].toJSON().exceptions[0].message).toBe('Bugsnag usage error. notify() expected error/opts parameters, got nothing')
        expect(payloads[1].events[0].toJSON().exceptions[0].message).toBe('Bugsnag usage error. notify() expected error/opts parameters, got null')
        expect(payloads[2].events[0].toJSON().exceptions[0].message).toBe('Bugsnag usage error. notify() expected error/opts parameters, got function')
        expect(payloads[3].events[0].toJSON().exceptions[0].message).toBe('Bugsnag usage error. notify() expected error/opts parameters, got unsupported object')
        expect(payloads[4].events[0].toJSON().exceptions[0].message).toBe('1')
        expect(payloads[5].events[0].toJSON().exceptions[0].message).toBe('errrororor')
        expect(payloads[6].events[0].toJSON().exceptions[0].message).toBe('str1')
        expect(payloads[7].events[0].toJSON().exceptions[0].message).toBe('str1')
        expect(payloads[7].events[0].toJSON().metaData).toEqual({})
        done()
      }, 1)
    })

    it('supports { name, message } usage', done => {
      const payloads = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({ sendEvent: (payload, cb) => { payloads.push(payload); cb() } }))
      client.notify({ name: 'UnknownThing', message: 'found a thing that couldn’t be dealt with' }, () => {}, () => {
        expect(payloads.length).toBe(1)
        expect(payloads[0].events[0].toJSON().exceptions[0].errorClass).toBe('UnknownThing')
        expect(payloads[0].events[0].toJSON().exceptions[0].message).toBe('found a thing that couldn’t be dealt with')
        expect(payloads[0].events[0].toJSON().exceptions[0].stacktrace[0].method).not.toMatch(/Client/)
        expect(payloads[0].events[0].toJSON().exceptions[0].stacktrace[0].file).not.toMatch(/core\/client\.js/)
        done()
      })
    })

    it('leaves a breadcrumb of the error', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({ sendEvent: (payload, cb) => cb() }))
      client.notify(new Error('foobar'), (event) => {
        // the error shouldn't appear as a breadcrumb for itself
        expect(event.breadcrumbs.length).toBe(0)
      }, () => {
        expect(client._breadcrumbs.length).toBe(1)
        expect(client._breadcrumbs[0].type).toBe('error')
        expect(client._breadcrumbs[0].message).toBe('Error')
        expect(client._breadcrumbs[0].metadata.stacktrace).toBe(undefined)
        done()
      })
    })

    it('doesn’t modify global client metadata when using event.addMetadata()', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client.addMetadata('foo', { list: [1, 2, 3] })
      client.notify(new Error('changes afoot'), event => {
        event.addMetadata('foo', 'things', 2)
      })
      expect(client.getMetadata('foo', 'things')).toBe(undefined)
    })

    it('should call the callback (success)', done => {
      const client = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendSession: () => {},
        sendEvent: (report, cb) => cb(null)
      }))
      client.notify(new Error('111'), () => {}, (err, report) => {
        expect(err).toBe(null)
        expect(report).toBeTruthy()
        expect(report.errors[0].errorMessage).toBe('111')
        done()
      })
    })

    it('should call the callback (err)', done => {
      const client = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendSession: () => {},
        sendEvent: (report, cb) => cb(new Error('flerp'))
      }))
      client.notify(new Error('111'), () => {}, (err, report) => {
        expect(err).toBeTruthy()
        expect(err.message).toBe('flerp')
        expect(report).toBeTruthy()
        expect(report.errors[0].errorMessage).toBe('111')
        done()
      })
    })

    it('should call the callback even if the report doesn’t send (enabledReleaseStages)', done => {
      const client = new Client(
        { apiKey: 'API_KEY', enabledReleaseStages: ['production'], releaseStage: 'development' },
        undefined,
        VALID_NOTIFIER
      )
      client._delivery(client => ({
        sendSession: () => {},
        sendEvent: (report, cb) => cb(null)
      }))
      client.notify(new Error('111'), () => {}, (err, report) => {
        expect(err).toBe(null)
        expect(report).toBeTruthy()
        expect(report.errors[0].errorMessage).toBe('111')
        done()
      })
    })

    it('should call the callback even if the report doesn’t send (onError)', done => {
      const client = new Client({ apiKey: 'API_KEY', onError: () => false }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendSession: () => {},
        sendEvent: (report, cb) => cb(null)
      }))
      client.notify(new Error('111'), {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.errors[0].errorMessage).toBe('111')
        done()
      })
    })

    it('should attach the original error to the report object', done => {
      const client = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      client._delivery(client => ({
        sendSession: () => {},
        sendEvent: (report, cb) => cb(null)
      }))
      const orig = new Error('111')
      client.notify(orig, () => {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.originalError).toBe(orig)
        done()
      })
    })
  })

  describe('leaveBreadcrumb()', () => {
    it('creates a manual breadcrumb when a list of arguments are supplied', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client.leaveBreadcrumb('french stick')
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0].type).toBe('manual')
      expect(client._breadcrumbs[0].message).toBe('french stick')
      expect(client._breadcrumbs[0].metadata).toEqual({})
    })

    it('caps the length of breadcrumbs at the configured limit', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 3 }, undefined, VALID_NOTIFIER)
      client.leaveBreadcrumb('malted rye')
      expect(client._breadcrumbs.length).toBe(1)
      client.leaveBreadcrumb('medium sliced white hovis')
      expect(client._breadcrumbs.length).toBe(2)
      client.leaveBreadcrumb('pumperninkel')
      expect(client._breadcrumbs.length).toBe(3)
      client.leaveBreadcrumb('seedy farmhouse')
      expect(client._breadcrumbs.length).toBe(3)
      expect(client._breadcrumbs.map(b => b.message)).toEqual([
        'medium sliced white hovis',
        'pumperninkel',
        'seedy farmhouse'
      ])
    })

    it('doesn’t add the breadcrumb if it didn’t contain anything useful', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      client.leaveBreadcrumb(undefined)
      client.leaveBreadcrumb(null, { data: 'is useful' })
      client.leaveBreadcrumb(null, {}, null)
      client.leaveBreadcrumb(null, { t: 10 }, null, 4)
      expect(client._breadcrumbs.length).toBe(3)
      expect(client._breadcrumbs[0].type).toBe('manual')
      expect(client._breadcrumbs[0].message).toBe('[empty]')
      expect(client._breadcrumbs[0].metadata).toEqual({ data: 'is useful' })
      expect(client._breadcrumbs[1].type).toBe('manual')
      expect(typeof client._breadcrumbs[2].timestamp).toBe('string')
    })

    it('allows maxBreadcrumbs to be set to 0', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 0 }, undefined, VALID_NOTIFIER)
      client.leaveBreadcrumb('toast')
      expect(client._breadcrumbs.length).toBe(0)
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      expect(client._breadcrumbs.length).toBe(0)
    })

    it('calls onBreadcrumb callbacks', () => {
      let calls = 0
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onBreadcrumb: b => {
          calls++
          expect(b.message).toBe('message')
          expect(b.type).toBe('manual')
          expect(b.metadata).toEqual({})
        }
      }, undefined, VALID_NOTIFIER)
      client.leaveBreadcrumb('message')
      expect(calls).toBe(1)
    })

    it('doesn’t store the breadcrumb if an onBreadcrumb callback returns false', () => {
      let calls = 0
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onBreadcrumb: b => {
          calls++
          return false
        }
      }, undefined, VALID_NOTIFIER)
      client.leaveBreadcrumb('message')
      expect(calls).toBe(1)
      expect(client._breadcrumbs.length).toBe(0)
    })

    it('ignores breadcrumb types that aren’t in the enabled list', () => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        enabledBreadcrumbTypes: ['manual']
      }, undefined, VALID_NOTIFIER)
      client.leaveBreadcrumb('brrrrr')
      client.leaveBreadcrumb('GET /jim', {}, 'request')
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0].message).toBe('brrrrr')
    })
  })

  describe('startSession()', () => {
    it('calls the provided the session delegate and return delegate’s return value', () => {
      const client = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      let ret
      client._sessionDelegate({
        startSession: c => {
          expect(c).toBe(client)
          ret = {}
          return ret
        }
      })
      expect(client.startSession()).toBe(ret)
    })

    it('tracks error counts using the session delegate and sends them in error payloads', (done) => {
      const client = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      let i = 0
      client._sessionDelegate({
        startSession: (client) => {
          client._session = new Session()
          return client
        }
      })
      client._delivery(client => ({
        sendSession: () => {},
        sendEvent: (report, cb) => {
          if (++i < 10) return
          const r = JSON.parse(JSON.stringify(report.events[0]))
          expect(r.session).toBeDefined()
          expect(r.session.events.handled).toBe(6)
          expect(r.session.events.unhandled).toBe(4)
          done()
        }
      }))
      const sessionClient = client.startSession()
      sessionClient.notify(new Error('broke'))
      sessionClient._notify(new Event('err', 'bad', [], null, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient._notify(new Event('err', 'bad', [], null, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient._notify(new Event('err', 'bad', [], null, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient._notify(new Event('err', 'bad', [], null, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    })

    it('does not start the session if onSession returns false', () => {
      const client = new Client({ apiKey: 'API_KEY', onSession: s => false }, undefined, VALID_NOTIFIER)
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._sessionDelegate(sessionDelegate)

      const startSpy = spyOn(sessionDelegate, 'startSession')
      client._sessionDelegate(sessionDelegate)

      client.startSession()
      expect(startSpy).toHaveBeenCalledTimes(0)
    })
  })

  describe('pause/resumeSession()', () => {
    it('forwards on calls to the session delegate', () => {
      const client = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._sessionDelegate(sessionDelegate)

      const startSpy = spyOn(sessionDelegate, 'startSession')
      const pauseSpy = spyOn(sessionDelegate, 'pauseSession')
      const resumeSpy = spyOn(sessionDelegate, 'resumeSession')
      client._sessionDelegate(sessionDelegate)

      client.startSession()
      expect(startSpy).toHaveBeenCalledTimes(1)
      client.pauseSession()
      expect(pauseSpy).toHaveBeenCalledTimes(1)
      client.resumeSession()
      expect(resumeSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUser() / setUser()', () => {
    it('sets and retries user properties', () => {
      const c = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      c.setUser('123')
      expect(c.getUser()).toEqual({ id: '123', email: undefined, name: undefined })
      c.setUser('123', 'bug@sn.ag')
      expect(c.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: undefined })
      c.setUser('123', 'bug@sn.ag', 'Bug S. Nag')
      expect(c.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag' })
      c.setUser()
      expect(c.getUser()).toEqual({ id: undefined, email: undefined, name: undefined })
    })

    it('can be set via config', () => {
      const c = new Client({ apiKey: 'API_KEY', user: { id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag' } }, undefined, VALID_NOTIFIER)
      expect(c.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag' })
    })
  })

  describe('callbacks', () => {
    it('supports adding and removing onError/onSession/onBreadcrumb callbacks', (done) => {
      const c = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      c._delivery(client => ({ sendEvent: (p, cb) => cb(null), sendSession: (s, cb) => cb(null) }))
      c._logger = console
      const eSpy = spyOn({ fn: () => {} }, 'fn')
      const bSpy = spyOn({ fn: () => {} }, 'fn')
      const sSpy = spyOn({ fn: () => {} }, 'fn')

      c.addOnError(eSpy)
      c.addOnSession(sSpy)
      c.addOnBreadcrumb(bSpy)

      expect(c._cbs.e.length).toBe(1)
      expect(c._cbs.s.length).toBe(1)
      expect(c._cbs.b.length).toBe(1)

      c.startSession()
      expect(sSpy).toHaveBeenCalledTimes(1)
      c.notify(new Error(), () => {}, () => {
        expect(bSpy).toHaveBeenCalledTimes(1)
        expect(bSpy).toHaveBeenCalledTimes(1)

        c.removeOnError(eSpy)
        c.removeOnSession(sSpy)
        c.removeOnBreadcrumb(bSpy)

        c.startSession()
        expect(sSpy).toHaveBeenCalledTimes(1)
        c.notify(new Error(), () => {}, () => {
          expect(bSpy).toHaveBeenCalledTimes(1)
          expect(bSpy).toHaveBeenCalledTimes(1)

          done()
        })
      })
    })
  })

  describe('get/setContext()', () => {
    it('modifies and retreives context', () => {
      const c = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      c.setContext('str')
      expect(c.getContext()).toBe('str')
    })
    it('can be set via config', () => {
      const c = new Client({ apiKey: 'API_KEY', context: 'str' }, undefined, VALID_NOTIFIER)
      expect(c.getContext()).toBe('str')
    })
  })

  describe('add/get/clearMetadata()', () => {
    it('modifies and retrieves metadata', () => {
      const c = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
      c.addMetadata('a', 'b', 'c')
      expect(c.getMetadata('a')).toEqual({ b: 'c' })
      expect(c.getMetadata('a', 'b')).toBe('c')
      c.clearMetadata('a', 'b')
      expect(c.getMetadata('a', 'b')).toBe(undefined)
      c.clearMetadata('a')
      expect(c.getMetadata('a')).toBe(undefined)
    })

    it('can be set in config', () => {
      const c = new Client({
        apiKey: 'API_KEY',
        metadata: {
          'system metrics': {
            ms_since_last_jolt: 10032
          }
        }
      }, undefined, VALID_NOTIFIER)
      expect(c.getMetadata('system metrics', 'ms_since_last_jolt')).toBe(10032)
    })
  })
})
