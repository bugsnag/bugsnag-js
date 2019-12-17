const { describe, it, expect, fail, spyOn } = global

const Client = require('../client')
const Event = require('../event')
const Session = require('../session')

describe('@bugsnag/core/client', () => {
  describe('constructor', () => {
    it('can handle bad input', () => {
      expect(() => new Client()).toThrow()
      expect(() => new Client('foo')).toThrow()
    })
  })

  describe('configure()', () => {
    it('handles bad/good input', () => {
      expect(() => {
        // no opts supplied
        const client = new Client({})
        expect(client).toBe(client)
      }).toThrow()

      // bare minimum opts supplied
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      expect(client._config.apiKey).toBe('API_KEY_YEAH')
    })
  })

  describe('use()', () => {
    it('supports plugins', done => {
      const client = new Client({ apiKey: '123' })
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
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      const log = (msg) => {
        expect(msg).toBeTruthy()
        done()
      }
      client._logger = { debug: log, info: log, warn: log, error: log }
      client._logger.debug('hey')
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
      })
      client._logger.debug('hey')
    })
    it('is ok with a null logger', () => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        logger: null
      })
      client._logger.debug('hey')
    })
  })

  describe('notify()', () => {
    it('delivers an error event', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({
        sendEvent: payload => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('warning')
          expect(event.severityReason).toEqual({ type: 'handledException' })
          process.nextTick(() => done())
        }
      }))
      client.notify(new Error('oh em gee'))
    })

    it('supports setting severity via callback', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)
          const event = payload.events[0].toJSON()
          expect(event.severity).toBe('info')
          expect(event.severityReason).toEqual({ type: 'userCallbackSetSeverity' })
          done()
        }
      }))
      client.notify(new Error('oh em gee'), event => {
        event.severity = 'info'
      })
    })

    it('supports preventing send by returning false', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          fail('sendEvent() should not be called')
        }
      }))

      client.notify(new Error('oh em gee'), event => false)

      // give the event loop a tick to see if the event gets sent
      process.nextTick(() => done())
    })

    it('tolerates errors in callbacks', done => {
      const onErrorSpy = spyOn({ onError: () => {} }, 'onError')
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onError: [
          event => {
            throw new Error('Ooops')
          },
          onErrorSpy
        ]
      })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].errorMessage).toBe('oh no!')
          expect(onErrorSpy).toHaveBeenCalledTimes(1)
          done()
        }
      }))

      client.notify(new Error('oh no!'))
    })

    it('supports preventing send with enabledReleaseStages', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledReleaseStages: ['qa'] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          fail('sendEvent() should not be called')
        }
      }))

      client.notify(new Error('oh em eff gee'))

      // give the event loop a tick to see if the event gets sent
      process.nextTick(() => done())
    })

    it('supports setting releaseStage via config.releaseStage', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', releaseStage: 'staging', enabledReleaseStages: ['production'] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          fail('sendEvent() should not be called')
        }
      }))

      client.notify(new Error('oh em eff gee'))

      // give the event loop a tick to see if the event gets sent
      process.nextTick(() => done())
    })

    it('includes releaseStage in event.app', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledReleaseStages: ['staging'], releaseStage: 'staging' })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].app.releaseStage).toBe('staging')
          done()
        }
      }))
      client.notify(new Error('oh em eff gee'))
    })

    it('populates app.version if config.appVersion is supplied', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', appVersion: '1.2.3' })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].app.version).toBe('1.2.3')
          done()
        }
      }))
      client.notify(new Error('oh em eff gee'))
    })

    it('can handle all kinds of bad input', () => {
      const payloads = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      client.notify(undefined)
      client.notify(null)
      client.notify(() => {})
      client.notify({ name: 'some message' })
      client.notify(1)
      client.notify('errrororor')
      client.notify('str1', 'str2')
      client.notify('str1', null)

      expect(payloads[0].events[0].toJSON().exceptions[0].message).toBe('notify() received a non-error. See "notify()" tab for more detail.')
      expect(payloads[0].events[0].toJSON().metaData).toEqual({ 'notify()': { 'non-error parameter': 'undefined' } })

      expect(payloads[1].events[0].toJSON().exceptions[0].message).toBe('notify() received a non-error. See "notify()" tab for more detail.')
      expect(payloads[1].events[0].toJSON().metaData).toEqual({ 'notify()': { 'non-error parameter': 'null' } })

      expect(payloads[2].events[0].toJSON().exceptions[0].message).toBe('notify() received a non-error. See "notify()" tab for more detail.')

      expect(payloads[3].events[0].toJSON().exceptions[0].message).toBe('notify() received a non-error. See "notify()" tab for more detail.')

      expect(payloads[4].events[0].toJSON().exceptions[0].message).toBe('1')
      expect(payloads[5].events[0].toJSON().exceptions[0].message).toBe('errrororor')
      expect(payloads[6].events[0].toJSON().exceptions[0].message).toBe('str1')

      expect(payloads[7].events[0].toJSON().exceptions[0].message).toBe('str1')
      expect(payloads[7].events[0].toJSON().metaData).toEqual({})
    })

    it('supports { name, message } usage', () => {
      const payloads = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
      client.notify({ name: 'UnknownThing', message: 'found a thing that couldn’t be dealt with' })

      expect(payloads.length).toBe(1)
      expect(payloads[0].events[0].toJSON().exceptions[0].errorClass).toBe('UnknownThing')
      expect(payloads[0].events[0].toJSON().exceptions[0].message).toBe('found a thing that couldn’t be dealt with')
      expect(payloads[0].events[0].toJSON().exceptions[0].stacktrace[0].method).not.toMatch(/Client/)
      expect(payloads[0].events[0].toJSON().exceptions[0].stacktrace[0].file).not.toMatch(/core\/client\.js/)
    })

    it('leaves a breadcrumb of the error', () => {
      const payloads = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
      client.notify(new Error('foobar'))
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0].type).toBe('error')
      expect(client.breadcrumbs[0].message).toBe('Error')
      expect(client.breadcrumbs[0].metadata.stacktrace).toBe(undefined)
      // the error shouldn't appear as a breadcrumb for itself
      expect(payloads[0].events[0].breadcrumbs.length).toBe(0)
    })

    it('doesn’t modify global client.metadata when using addMetadata() method', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client.addMetadata('foo', 'bar', [1, 2, 3])
      client.notify(new Error('changes afoot'), (event) => {
        event.addMetadata('foo', '3', 1)
      })
      expect(client._metadata.foo['3']).toBe(undefined)
    })

    it('should call the callback (success)', done => {
      const client = new Client({ apiKey: 'API_KEY' })
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => cb(null)
      }))
      client.notify(new Error('111'), {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.errorMessage).toBe('111')
        done()
      })
    })

    it('should call the callback (err)', done => {
      const client = new Client({ apiKey: 'API_KEY' })
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => cb(new Error('flerp'))
      }))
      client.notify(new Error('111'), {}, (err, event) => {
        expect(err).toBeTruthy()
        expect(err.message).toBe('flerp')
        expect(event).toBeTruthy()
        expect(event.errorMessage).toBe('111')
        done()
      })
    })

    it('should call the callback even if the event doesn’t send (enabledReleaseStages)', done => {
      const client = new Client({ apiKey: 'API_KEY', enabledReleaseStages: ['production'], releaseStage: 'development' })
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => cb(null)
      }))
      client.notify(new Error('111'), {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.errorMessage).toBe('111')
        done()
      })
    })

    it('should call the callback even if the event doesn’t send (onError)', done => {
      const client = new Client({ apiKey: 'API_KEY', onError: () => false })
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => cb(null)
      }))
      client.notify(new Error('111'), {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.errorMessage).toBe('111')
        done()
      })
    })

    it('should attach the original error to the event object', done => {
      const client = new Client({ apiKey: 'API_KEY', onError: () => false })
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => cb(null)
      }))
      const orig = new Error('111')
      client.notify(orig, {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.originalError).toBe(orig)
        done()
      })
    })
  })

  describe('leaveBreadcrumb()', () => {
    it('creates a manual breadcrumb when a list of arguments are supplied', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client.leaveBreadcrumb('french stick')
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0].type).toBe('manual')
      expect(client.breadcrumbs[0].message).toBe('french stick')
      expect(client.breadcrumbs[0].metadata).toEqual({})
    })

    it('caps the length of breadcrumbs at the configured limit', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 3 })
      client.leaveBreadcrumb('malted rye')
      expect(client.breadcrumbs.length).toBe(1)
      client.leaveBreadcrumb('medium sliced white hovis')
      expect(client.breadcrumbs.length).toBe(2)
      client.leaveBreadcrumb('pumperninkel')
      expect(client.breadcrumbs.length).toBe(3)
      client.leaveBreadcrumb('seedy farmhouse')
      expect(client.breadcrumbs.length).toBe(3)
      expect(client.breadcrumbs.map(b => b.message)).toEqual([
        'medium sliced white hovis',
        'pumperninkel',
        'seedy farmhouse'
      ])
    })

    it('doesn’t add the breadcrumb if it didn’t contain a message', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client.leaveBreadcrumb(undefined)
      client.leaveBreadcrumb(null, { data: 'is useful' })
      client.leaveBreadcrumb(null, {}, null)
      client.leaveBreadcrumb(null, { t: 10 }, null, 4)
      expect(client.breadcrumbs.length).toBe(0)
    })

    it('allows maxBreadcrumbs to be set to 0', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 0 })
      client.leaveBreadcrumb('toast')
      expect(client.breadcrumbs.length).toBe(0)
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      expect(client.breadcrumbs.length).toBe(0)
    })

    it('doesn’t store the breadcrumb if an onBreadcrumb callback returns false', () => {
      let calls = 0
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onBreadcrumb: b => {
          calls++
          return false
        }
      })
      client.leaveBreadcrumb('message')
      expect(calls).toBe(1)
      expect(client.breadcrumbs.length).toBe(0)
    })

    it('tolerates errors in onBreadcrumb callbacks', () => {
      let calls = 0
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onBreadcrumb: b => {
          calls++
          throw new Error('uh oh')
        }
      })
      client.leaveBreadcrumb('message')
      expect(calls).toBe(1)
      expect(client.breadcrumbs.length).toBe(1)
    })

    it('ignores breadcrumb types that aren’t in the enabled list', () => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        enabledBreadcrumbTypes: ['manual']
      })
      client.leaveBreadcrumb('brrrrr')
      client.leaveBreadcrumb('GET /jim', {}, 'request')
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0].message).toBe('brrrrr')
    })
  })

  describe('startSession()', () => {
    it('calls the provided the session delegate and return delegate’s return value', () => {
      const client = new Client({ apiKey: 'API_KEY' })
      let ret
      client._sessionDelegate = {
        startSession: c => {
          expect(c).toBe(client)
          ret = {}
          return ret
        }
      }
      expect(client.startSession()).toBe(ret)
    })

    it('tracks error counts using the session delegate and sends them in error payloads', (done) => {
      const client = new Client({ apiKey: 'API_KEY' })
      let i = 0
      client._sessionDelegate = {
        startSession: (client) => {
          client._session = new Session()
          return client
        }
      }
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => {
          if (++i < 10) return
          const r = JSON.parse(JSON.stringify(payload.events[0]))
          expect(r.session).toBeDefined()
          expect(r.session.events.handled).toBe(6)
          expect(r.session.events.unhandled).toBe(4)
          done()
        }
      }))
      const sessionClient = client.startSession()
      sessionClient.notify(new Error('broke'))
      sessionClient._notify(new Event('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient._notify(new Event('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient.notify(new Error('broke'))
      sessionClient._notify(new Event('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
      sessionClient._notify(new Event('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    })

    it('does not start the session if onSession returns false', () => {
      const client = new Client({ apiKey: 'API_KEY', onSession: s => false })
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._sessionDelegate = sessionDelegate

      const startSpy = spyOn(sessionDelegate, 'startSession')

      client.startSession()
      expect(startSpy).toHaveBeenCalledTimes(0)
    })

    it('tolerates errors in onSession callbacks', () => {
      const client = new Client({
        apiKey: 'API_KEY',
        onSession: s => {
          throw new Error('oh no')
        }
      })
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._sessionDelegate = sessionDelegate

      const startSpy = spyOn(sessionDelegate, 'startSession')

      client.startSession()
      expect(startSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('callbacks', () => {
    it('supports adding and removing onError/onSession/onBreadcrumb callbacks', (done) => {
      const c = new Client({ apiKey: 'API_KEY' })
      c._setDelivery(client => ({ sendEvent: (p, cb) => cb(null), sendSession: (s, cb) => cb(null) }))
      c._logger = console
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      c._sessionDelegate = sessionDelegate
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
        expect(eSpy).toHaveBeenCalledTimes(1)

        c.removeOnError(eSpy)
        c.removeOnSession(sSpy)
        c.removeOnBreadcrumb(bSpy)

        c.startSession()
        expect(sSpy).toHaveBeenCalledTimes(1)
        c.notify(new Error(), () => {}, () => {
          expect(bSpy).toHaveBeenCalledTimes(1)
          expect(eSpy).toHaveBeenCalledTimes(1)

          done()
        })
      })
    })
  })

  describe('add/get/clearMetadata()', () => {
    it('modifies and retrieves metadata', () => {
      const client = new Client({ apiKey: 'API_KEY' })
      client.addMetadata('a', 'b', 'c')
      expect(client.getMetadata('a')).toEqual({ b: 'c' })
      expect(client.getMetadata('a', 'b')).toBe('c')
      client.clearMetadata('a', 'b')
      expect(client.getMetadata('a', 'b')).toBe(undefined)
      client.clearMetadata('a')
      expect(client.getMetadata('a')).toBe(undefined)
    })

    it('can be set in config', () => {
      const client = new Client({
        apiKey: 'API_KEY',
        metadata: {
          'system metrics': {
            ms_since_last_jolt: 10032
          }
        }
      })
      expect(client.getMetadata('system metrics', 'ms_since_last_jolt')).toBe(10032)
    })
  })

  describe('pause/resumeSession()', () => {
    it('forwards on calls to the session delegate', () => {
      const client = new Client({ apiKey: 'API_KEY' })
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._sessionDelegate = sessionDelegate

      const startSpy = spyOn(sessionDelegate, 'startSession')
      const pauseSpy = spyOn(sessionDelegate, 'pauseSession')
      const resumeSpy = spyOn(sessionDelegate, 'resumeSession')
      client._sessionDelegate = sessionDelegate

      client.startSession()
      expect(startSpy).toHaveBeenCalledTimes(1)
      client.pauseSession()
      expect(pauseSpy).toHaveBeenCalledTimes(1)
      client.resumeSession()
      expect(resumeSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUser() / setUser()', () => {
    it('sets and retrieves user properties', () => {
      const c = new Client({ apiKey: 'aaaa' })
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
      const c = new Client({ apiKey: 'API_KEY', user: { id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag' } })
      expect(c.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag' })
    })
  })
})
