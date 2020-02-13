import { EventEmitter } from 'events'
import Client from '@bugsnag/core/client'
import _Tracker from '../tracker'
import plugin from '../session'

const Tracker = _Tracker as jest.MockedClass<typeof _Tracker>

jest.mock('../tracker')

describe('plugin: server sessions', () => {
  beforeEach(() => {
    class TrackerMock extends EventEmitter {
      start () {
        this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ])
      }

      stop () {}
      track () {}
    }

    Tracker.mockImplementation(() => new TrackerMock() as any)
  })
  it('should send the session', done => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c._setDelivery(client => ({
      sendEvent: () => {},
      sendSession: (session: any, cb = () => {}) => {
        expect(session.sessionCounts.length).toBe(1)
        expect(session.sessionCounts[0].sessionsStarted).toBe(123)
        done()
      }
    }))

    c.use(plugin)
    c.startSession()
  })

  it('should not send the session when releaseStage is not in enabledReleaseStages', done => {
    expect.assertions(1)
    const c = new Client({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      logger: {
        debug: () => {},
        info: () => {},
        warn: (msg) => {
          expect(msg).toBe('Session not sent due to releaseStage/enabledReleaseStages configuration')
          setTimeout(done, 150)
        },
        error: () => {}
      },
      endpoints: { notify: 'bloo', sessions: 'blah' },
      releaseStage: 'qa',
      enabledReleaseStages: ['production']
    })
    c._setDelivery(client => ({
      sendEvent: () => {},
      sendSession: (session: any, cb = () => {}) => {
        done(new Error('no session should be sent'))
      }
    }))

    c.use(plugin)
    c.startSession()
  })

  it('should include the correct app and device payload properties', done => {
    expect.assertions(5)
    const c = new Client({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      endpoints: { notify: 'bloo', sessions: 'blah' },
      enabledReleaseStages: ['qa'],
      releaseStage: 'qa',
      appType: 'server',
      appVersion: '1.2.3'
    })

    // this is normally set by a plugin
    c._addOnSessionPayload(sp => {
      sp.device = { hostname: 'test-machine.local', runtimeVersions: { node: '0.0.1' } }
    })

    c._setDelivery(client => ({
      sendEvent: () => {},
      sendSession: (session: any, cb = () => {}) => {
        expect(session.sessionCounts.length).toBe(1)
        expect(session.sessionCounts[0].sessionsStarted).toBe(123)
        expect(session.app).toEqual({ version: '1.2.3', releaseStage: 'qa', type: 'server' })
        expect(session.device.hostname).toBe('test-machine.local')
        expect(session.device.runtimeVersions.node).toBe('0.0.1')
        done()
      }
    }))

    c.use(plugin)
    c.startSession()
  })

  it('should clone properties that shouldn’t be mutated on the original client', () => {
    class TrackerMock extends EventEmitter {
      start () {}
      stop () {}
      track () {}
    }
    Tracker.mockImplementation(() => new TrackerMock() as any)

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.use(plugin)

    c.leaveBreadcrumb('tick')
    c._metadata = { datetime: { tz: 'GMT+1' } }

    const sessionClient = c.startSession()

    sessionClient.leaveBreadcrumb('tock')
    sessionClient.addMetadata('other', { widgetsAdded: 'cat,dog,mouse' })

    expect(c._breadcrumbs.length).toBe(1)
    expect(Object.keys(c._metadata).length).toBe(1)
    expect(sessionClient._breadcrumbs.length).toBe(2)
    expect(Object.keys(sessionClient._metadata).length).toBe(2)
  })

  it('should support pausing/resuming sessions', () => {
    class TrackerMock extends EventEmitter {
      start () {}
      stop () {}
      track () {}
    }
    Tracker.mockImplementation(() => new TrackerMock() as any)

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.use(plugin)

    // start a session and get its id
    const sessionClient = c.startSession()
    const sid0 = sessionClient._session?.id

    // ensure pausing the session clears the client._session property
    sessionClient.pauseSession()
    const s1 = sessionClient._session
    const psid1 = sessionClient._pausedSession?.id
    expect(s1).toBe(null)
    expect(psid1).toBe(sid0)

    // ensure resuming the session gets back the original session (not a new one)
    sessionClient.resumeSession()
    const sid2 = sessionClient._session?.id
    expect(sid2).toBe(sid0)

    // ensure resumeSession() starts a new one when no paused session exists
    sessionClient._session = null
    sessionClient._pausedSession = null
    const resumedClient = sessionClient.resumeSession()
    expect(resumedClient._session).toBeTruthy()
    const sid3 = resumedClient._session?.id
    expect(sid3).not.toBe(sid0)
  })
})
