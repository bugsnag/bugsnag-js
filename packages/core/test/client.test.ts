import Client from '../client'
import Event from '../event'
import Session from '../session'
import breadcrumbTypes from '../lib/breadcrumb-types'
import { BreadcrumbType } from '../types/common'

describe('@bugsnag/core/client', () => {
  describe('constructor', () => {
    it('can handle bad input', () => {
      // @ts-ignore
      expect(() => new Client()).toThrow()
      // @ts-ignore
      expect(() => new Client('foo')).toThrow()
    })
  })

  describe('configure()', () => {
    it('handles bad/good input', () => {
      expect(() => {
        // no opts supplied
        // @ts-ignore
        const client = new Client({})
        expect(client).toBe(client)
      }).toThrow()

      // bare minimum opts supplied
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      expect(client._config.apiKey).toBe('API_KEY_YEAH')
    })

    it('extends partial options', () => {
      const client = new Client({
        apiKey: 'API_KEY',
        enabledErrorTypes: { unhandledExceptions: false }
      })
      expect(client._config.enabledErrorTypes).toEqual({
        unhandledExceptions: false,
        unhandledRejections: true
      })
    })

    it('warns with a valid but incorrect-looking api key', () => {
      const logger = {
        debug: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }
      const client = new Client({
        apiKey: 'API_KEY',
        logger
      })
      expect(client).toBeTruthy()
      expect(logger.warn.mock.calls.length).toBe(1)
      expect(logger.warn.mock.calls[0][0].message).toBe('Invalid configuration\n  - apiKey should be a string of 32 hexadecimal characters, got "API_KEY"')
    })

    it('does not warn with a valid api key', () => {
      const logger = {
        debug: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }
      const client = new Client({
        apiKey: '123456abcdef123456abcdef123456ab',
        logger
      })
      expect(client).toBeTruthy()
      expect(logger.warn.mock.calls.length).toBe(0)
    })
  })

  describe('use()', () => {
    it('supports plugins', done => {
      let pluginClient
      const client = new Client({
        apiKey: '123',
        plugins: [{
          name: 'test plugin',
          load: (c) => {
            pluginClient = c
            done()
          }
        }]
      })
      expect(pluginClient).toEqual(client)
    })
  })

  describe('logger()', () => {
    it('can supply a different logger', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      const log = (msg: any) => {
        expect(msg).toBeTruthy()
        done()
      }
      client._logger = { debug: log, info: log, warn: log, error: log }
      client._logger.debug('hey')
    })
    it('can supply a different logger via config', done => {
      const log = (msg: any) => {
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

      expect(() => {
        client._logger.debug('hey')
      }).not.toThrow()
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
        },
        sendSession: () => {}
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
        },
        sendSession: () => {}
      }))
      client.notify(new Error('oh em gee'), event => {
        event.severity = 'info'
      })
    })

    it('supports setting unhandled via callback', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })

      const session = new Session()
      // @ts-ignore
      client._session = session

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload).toBeTruthy()
          expect(Array.isArray(payload.events)).toBe(true)

          const event = payload.events[0].toJSON()

          expect(event.unhandled).toBe(true)
          expect(event.severityReason).toEqual({
            type: 'handledException',
            unhandledOverridden: true
          })

          expect(event.session).toEqual(session)
          expect((event.session as Session)._handled).toBe(0)
          expect((event.session as Session)._unhandled).toBe(1)

          done()
        },
        sendSession: () => {}
      }))

      client.notify(new Error('oh em gee'), event => {
        event.unhandled = true
      })
    })

    // eslint-disable-next-line jest/expect-expect
    it('supports preventing send by returning false in onError callback', done => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onError: () => false
      })

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          done('sendEvent() should not be called')
        },
        sendSession: () => {}
      }))

      client.notify(new Error('oh em gee'))

      // give the event loop a tick to see if the event gets sent
      process.nextTick(() => done())
    })

    // eslint-disable-next-line jest/expect-expect
    it('supports preventing send by returning a Promise that resolves to false in onError callback', done => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onError: () => Promise.resolve(false)
      })

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          done('sendEvent() should not be called')
        },
        sendSession: () => {}
      }))

      client.notify(new Error('oh em gee'), () => {}, () => {
        // give the event loop a tick to see if the event gets sent
        process.nextTick(() => done())
      })
    })

    // eslint-disable-next-line jest/expect-expect
    it('supports preventing send by returning false in notify callback', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          done('sendEvent() should not be called')
        },
        sendSession: () => {}
      }))

      client.notify(new Error('oh em gee'), () => false)

      // give the event loop a tick to see if the event gets sent
      process.nextTick(() => done())
    })

    it('tolerates errors in callbacks', done => {
      expect.assertions(2)

      const onErrorSpy = jest.fn()
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
          expect(payload.events[0].errors[0].errorMessage).toBe('oh no!')
          expect(onErrorSpy).toHaveBeenCalledTimes(1)
          done()
        },
        sendSession: () => {}
      }))

      client.notify(new Error('oh no!'))
    })

    // eslint-disable-next-line jest/expect-expect
    it('supports preventing send with enabledReleaseStages', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledReleaseStages: ['qa'] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          done('sendEvent() should not be called')
        },
        sendSession: () => {}
      }))

      client.notify(new Error('oh em eff gee'))

      // give the event loop a tick to see if the event gets sent
      process.nextTick(() => done())
    })

    // eslint-disable-next-line jest/expect-expect
    it('supports setting releaseStage via config.releaseStage', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', releaseStage: 'staging', enabledReleaseStages: ['production'] })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          done('sendEvent() should not be called')
        },
        sendSession: () => {}
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
        },
        sendSession: () => {}
      }))
      client.notify(new Error('oh em eff gee'))
    })

    it('populates app.version if config.appVersion is supplied', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', appVersion: '1.2.3' })
      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].app.version).toBe('1.2.3')
          done()
        },
        sendSession: () => {}
      }))
      client.notify(new Error('oh em eff gee'))
    })

    it('can handle all kinds of bad input', () => {
      const payloads: any[] = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      // @ts-ignore
      client.notify(undefined)
      // @ts-ignore
      client.notify(null)
      // @ts-ignore
      client.notify(() => {})
      // @ts-ignore
      client.notify({ name: 'some message' })
      // @ts-ignore
      client.notify(1)
      client.notify('errrororor')
      // @ts-ignore
      client.notify('str1', 'str2')
      // @ts-ignore
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
      const payloads: any[] = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
      client.notify({ name: 'UnknownThing', message: 'found a thing that couldn’t be dealt with' })

      expect(payloads.length).toBe(1)
      expect(payloads[0].events[0].toJSON().exceptions[0].errorClass).toBe('UnknownThing')
      expect(payloads[0].events[0].toJSON().exceptions[0].message).toBe('found a thing that couldn’t be dealt with')
      expect(payloads[0].events[0].toJSON().exceptions[0].stacktrace[0].method).not.toMatch(/Client/)
      expect(payloads[0].events[0].toJSON().exceptions[0].stacktrace[0].file).not.toMatch(/core\/client\.js/)
    })

    it('leaves a breadcrumb of the error', () => {
      const payloads: any[] = []
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
      client.notify(new Error('foobar'))
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0].type).toBe('error')
      expect(client._breadcrumbs[0].message).toBe('Error')
      expect(client._breadcrumbs[0].metadata.stacktrace).toBe(undefined)
      // the error shouldn't appear as a breadcrumb for itself
      expect(payloads[0].events[0].breadcrumbs.length).toBe(0)
    })

    it('leaves a breadcrumb of the error when enabledBreadcrumbTypes=null', () => {
      const payloads: any[] = []
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledBreadcrumbTypes: null })
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
      client.notify(new Error('foobar'))
      expect(client._breadcrumbs).toHaveLength(1)
      expect(client._breadcrumbs[0].type).toBe('error')
      expect(client._breadcrumbs[0].message).toBe('Error')
      expect(client._breadcrumbs[0].metadata.stacktrace).toBe(undefined)
      // the error shouldn't appear as a breadcrumb for itself
      expect(payloads[0].events[0].breadcrumbs).toHaveLength(0)
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

      const session = new Session()
      // @ts-ignore
      client._session = session

      client.notify(new Error('111'), () => {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.errors[0].errorMessage).toBe('111')

        expect((event as Event)._session).toBe(session)
        expect(session.toJSON().events.handled).toBe(1)
        done()
      })
    })

    it('should call the callback (err)', done => {
      const client = new Client({ apiKey: 'API_KEY' })
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => cb(new Error('flerp'))
      }))

      const session = new Session()
      // @ts-ignore
      client._session = session

      client.notify(new Error('111'), () => {}, (err, event) => {
        expect(err).toBeTruthy()
        expect(err.message).toBe('flerp')
        expect(event).toBeTruthy()
        expect(event.errors[0].errorMessage).toBe('111')

        expect((event as Event)._session).toBe(session)
        expect(session.toJSON().events.handled).toBe(1)
        done()
      })
    })

    it('should call the callback even if the event doesn’t send (enabledReleaseStages)', done => {
      const client = new Client({ apiKey: 'API_KEY', enabledReleaseStages: ['production'], releaseStage: 'development' })

      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: () => { done('sendEvent() should not be called') }
      }))

      const session = new Session()
      // @ts-ignore
      client._session = session

      client.notify(new Error('111'), () => {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.errors[0].errorMessage).toBe('111')
        expect((event as Event)._session).toBe(undefined)
        done()
      })
    })

    it('should call the callback even if the event doesn’t send (onError)', done => {
      const client = new Client({ apiKey: 'API_KEY', onError: () => false })

      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: () => { done('sendEvent() should not be called') }
      }))

      const session = new Session()
      // @ts-ignore
      client._session = session

      client.notify(new Error('111'), () => {}, (err, event) => {
        expect(err).toBe(null)
        expect(event).toBeTruthy()
        expect(event.errors[0].errorMessage).toBe('111')
        expect((event as Event)._session).toBe(undefined)
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
      // @ts-ignore
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
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0].type).toBe('manual')
      expect(client._breadcrumbs[0].message).toBe('french stick')
      expect(client._breadcrumbs[0].metadata).toEqual({})
    })

    it('caps the length of breadcrumbs at the configured limit', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 3 })
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

    it('doesn’t add the breadcrumb if it didn’t contain a message', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })
      // @ts-ignore
      client.leaveBreadcrumb(undefined)
      // @ts-ignore
      client.leaveBreadcrumb(null, { data: 'is useful' })
      // @ts-ignore
      client.leaveBreadcrumb(null, {}, null)
      // @ts-ignore
      client.leaveBreadcrumb(null, { t: 10 }, null, 4)
      expect(client._breadcrumbs.length).toBe(0)
    })

    it('allows maxBreadcrumbs to be set to 0', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', maxBreadcrumbs: 0 })
      client.leaveBreadcrumb('toast')
      expect(client._breadcrumbs.length).toBe(0)
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      client.leaveBreadcrumb('toast')
      expect(client._breadcrumbs.length).toBe(0)
    })

    it('doesn’t store the breadcrumb if an onBreadcrumb callback returns false', () => {
      let calls = 0
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onBreadcrumb: () => {
          calls++
          return false
        }
      })
      client.leaveBreadcrumb('message')
      expect(calls).toBe(1)
      expect(client._breadcrumbs.length).toBe(0)
    })

    it('tolerates errors in onBreadcrumb callbacks', () => {
      let calls = 0
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        onBreadcrumb: () => {
          calls++
          throw new Error('uh oh')
        }
      })
      client.leaveBreadcrumb('message')
      expect(calls).toBe(1)
      expect(client._breadcrumbs.length).toBe(1)
    })

    it('coerces breadcrumb types that aren’t valid to "manual"', () => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH'
      })
      // @ts-ignore
      client.leaveBreadcrumb('GET /jim', {}, 'requeeest')
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0].type).toBe('manual')
    })

    it('only leaves an error breadcrumb if enabledBreadcrumbTypes contains "error"', (done) => {
      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        enabledBreadcrumbTypes: []
      })
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload, cb) => cb(null)
      }))
      client.notify(new Error('oh no'), () => {}, () => {
        expect(client._breadcrumbs.length).toBe(0)
        done()
      })
    })
  })

  describe('_isBreadcrumbTypeEnabled()', () => {
    it.each(breadcrumbTypes)('returns true for "%s" when enabledBreadcrumbTypes is not configured', (type) => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' })

      expect(client._isBreadcrumbTypeEnabled(type)).toBe(true)
    })

    it.each(breadcrumbTypes)('returns true for "%s" when enabledBreadcrumbTypes=null', (type) => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledBreadcrumbTypes: null })

      expect(client._isBreadcrumbTypeEnabled(type)).toBe(true)
    })

    it.each(breadcrumbTypes)('returns false for "%s" when enabledBreadcrumbTypes=[]', (type) => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledBreadcrumbTypes: [] })

      expect(client._isBreadcrumbTypeEnabled(type)).toBe(false)
    })

    it.each(breadcrumbTypes)('returns true for "%s" when enabledBreadcrumbTypes only contains it', (type) => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', enabledBreadcrumbTypes: [type as BreadcrumbType] })

      expect(client._isBreadcrumbTypeEnabled(type)).toBe(true)
    })

    it.each(breadcrumbTypes)('returns false for "%s" when enabledBreadcrumbTypes does not contain it', (type) => {
      const enabledBreadcrumbTypes = breadcrumbTypes.filter(enabledType => enabledType !== type)

      const client = new Client({
        apiKey: 'API_KEY_YEAH',
        enabledBreadcrumbTypes: enabledBreadcrumbTypes as BreadcrumbType[]
      })

      expect(client._isBreadcrumbTypeEnabled(type)).toBe(false)
    })
  })

  describe('startSession()', () => {
    it('calls the provided session delegate and return delegate’s return value', () => {
      const client = new Client({ apiKey: 'API_KEY' })
      let ret
      client._sessionDelegate = {
        startSession: c => {
          expect(c).toBe(client)
          ret = {}
          return ret
        },
        pauseSession: () => {},
        resumeSession: () => {}
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
        },
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._setDelivery(client => ({
        sendSession: () => {},
        sendEvent: (payload: any, cb: any) => {
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
      const client = new Client({ apiKey: 'API_KEY', onSession: () => false })
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._sessionDelegate = sessionDelegate

      const startSpy = jest.spyOn(sessionDelegate, 'startSession')

      client.startSession()
      expect(startSpy).toHaveBeenCalledTimes(0)
    })

    it('tolerates errors in onSession callbacks', () => {
      const client = new Client({
        apiKey: 'API_KEY',
        onSession: () => {
          throw new Error('oh no')
        }
      })
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      client._sessionDelegate = sessionDelegate

      const startSpy = jest.spyOn(sessionDelegate, 'startSession')

      client.startSession()
      expect(startSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('callbacks', () => {
    it('supports adding and removing onError/onSession/onBreadcrumb callbacks', (done) => {
      const c = new Client({ apiKey: 'API_KEY' })
      c._setDelivery(client => ({ sendEvent: (p, cb) => cb(null), sendSession: (s: any, cb: any) => cb(null) }))
      c._logger = console
      const sessionDelegate = {
        startSession: () => {},
        pauseSession: () => {},
        resumeSession: () => {}
      }
      c._sessionDelegate = sessionDelegate
      const eSpy = jest.fn()
      const bSpy = jest.fn()
      const sSpy = jest.fn()

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

  describe('get/setContext()', () => {
    it('modifies and retreives context', () => {
      const c = new Client({ apiKey: 'API_KEY' })
      c.setContext('str')
      expect(c.getContext()).toBe('str')
    })
    it('can be set via config', () => {
      const c = new Client({ apiKey: 'API_KEY', context: 'str' })
      expect(c.getContext()).toBe('str')
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

      const startSpy = jest.spyOn(sessionDelegate, 'startSession')
      const pauseSpy = jest.spyOn(sessionDelegate, 'pauseSession')
      const resumeSpy = jest.spyOn(sessionDelegate, 'resumeSession')
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
