import { EventEmitter } from 'events'
import Client from '@bugsnag/core/client'
import _Tracker from '../tracker'
import plugin from '../session'
import { Session } from '@bugsnag/core'

const Tracker = _Tracker as jest.MockedClass<typeof _Tracker>

jest.mock('../tracker')

describe('plugin: server sessions', () => {
  beforeEach(() => {
    class TrackerMock extends EventEmitter {
      start () {
        setTimeout(() => this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ]))
      }

      stop () {}
      track () {}
    }

    Tracker.mockImplementation(() => new TrackerMock() as any)
  })

  it('should send the session', done => {
    const c = new Client({ apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, undefined, [plugin])
    c._setDelivery(client => ({
      sendEvent: () => {},
      sendSession: (session: any, cb = () => {}) => {
        expect(session.sessionCounts.length).toBe(1)
        expect(session.sessionCounts[0].sessionsStarted).toBe(123)
        done()
      }
    }))

    c.startSession()
  })

  it('should not send the session when releaseStage is not in enabledReleaseStages', done => {
    expect.assertions(1)
    const c = new Client({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
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
    }, undefined, [plugin])
    c._setDelivery(client => ({
      sendEvent: () => {},
      sendSession: (session: any, cb = () => {}) => {
        done(new Error('no session should be sent'))
      }
    }))

    c.startSession()
  })

  it('should include the correct app and device payload properties', done => {
    expect.assertions(5)
    const c = new Client({
      apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      endpoints: { notify: 'bloo', sessions: 'blah' },
      enabledReleaseStages: ['qa'],
      releaseStage: 'qa',
      appType: 'server',
      appVersion: '1.2.3'
    }, undefined, [plugin])

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

    c.startSession()
  })

  it('should support pausing/resuming sessions', () => {
    class TrackerMock extends EventEmitter {
      start () {}
      stop () {}
      track () {}
    }
    Tracker.mockImplementation(() => new TrackerMock() as any)

    const c = new Client({ apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, undefined, [plugin])

    // start a session and get its idc.startSession()
    c.startSession()
    const sid0 = (c._session as Session).id

    // ensure pausing the session clears the client._session property
    c.pauseSession()
    const s1 = c._session
    const psid1 = (c._pausedSession as Session).id
    expect(s1).toBe(null)
    expect(psid1).toBe(sid0)

    // ensure resuming the session gets back the original session (not a new one)
    c.resumeSession()
    const sid2 = (c._session as Session).id
    expect(sid2).toBe(sid0)

    // ensure resumeSession() starts a new one when no paused session exists
    c._session = null
    c._pausedSession = null
    c.resumeSession()
    expect(c._session).toBeTruthy()
    const sid3 = (c._session as unknown as Session).id
    expect(sid3).not.toBe(sid0)
  })
})
