const { describe, it, expect } = global

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Emitter = require('events')
const Client = require('@bugsnag/core/client')

describe('plugin: server sessions', () => {
  it('should send the session', done => {
    class TrackerMock extends Emitter {
      start () {
        this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ])
      }

      stop () {}
      track () {}
    }
    const plugin = proxyquire('../session', {
      './tracker': TrackerMock
    })
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c._setDelivery(client => ({
      sendEvent: () => {},
      sendSession: (session, cb = () => {}) => {
        expect(session.sessionCounts.length).toBe(1)
        expect(session.sessionCounts[0].sessionsStarted).toBe(123)
        done()
      }
    }))

    c.use(plugin)
    c.startSession()
  })

  it('should not send the session when releaseStage is not in enabledReleaseStages', done => {
    class TrackerMock extends Emitter {
      start () {
        this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ])
      }

      stop () {}
      track () {}
    }
    const plugin = proxyquire('../session', {
      './tracker': TrackerMock
    })

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
      sendSession: (session, cb = () => {}) => {
        // no session should be sent
        expect(true).toBe(false)
      }
    }))

    c.use(plugin)
    c.startSession()
  })

  it('should include the correct app and device payload properties', done => {
    class TrackerMock extends Emitter {
      start () {
        this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ])
      }

      stop () {}
      track () {}
    }
    const plugin = proxyquire('../session', { './tracker': TrackerMock })

    const c = new Client({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      endpoints: { notify: 'bloo', sessions: 'blah' },
      enabledReleaseStages: ['qa'],
      releaseStage: 'qa',
      appType: 'server',
      appVersion: '1.2.3'
    })

    // this is normally set by a plugin
    c.device = { hostname: 'test-machine.local', runtimeVersions: { node: '0.0.1' } }

    c._setDelivery(client => ({
      sendEvent: () => {},
      sendSession: (session, cb = () => {}) => {
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
    class TrackerMock extends Emitter {
      start () {}
      stop () {}
      track () {}
    }
    const plugin = proxyquire('../session', { './tracker': TrackerMock })

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.use(plugin)

    c.leaveBreadcrumb('tick')
    c._metadata = { datetime: { tz: 'GMT+1' } }

    const sessionClient = c.startSession()

    sessionClient.leaveBreadcrumb('tock')
    sessionClient.addMetadata('other', { widgetsAdded: 'cat,dog,mouse' })

    expect(c.breadcrumbs.length).toBe(1)
    expect(Object.keys(c._metadata).length).toBe(1)
    expect(sessionClient.breadcrumbs.length).toBe(2)
    expect(Object.keys(sessionClient._metadata).length).toBe(2)
  })

  it('should support pausing/resuming sessions', () => {
    class TrackerMock extends Emitter {
      start () {}
      stop () {}
      track () {}
    }
    const plugin = proxyquire('../session', { './tracker': TrackerMock })

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.use(plugin)
    const sessionClient = c.startSession()
    const sid0 = sessionClient._session.id
    sessionClient.pauseSession()
    const s1 = sessionClient._session
    sessionClient.resumeSession()
    const sid2 = sessionClient._session.id
    expect(sid2).toBe(sid0)
    expect(s1).toBe(null)
    sessionClient._session = null
    const resumedClient = sessionClient.resumeSession()
    expect(resumedClient._session).toBeTruthy()
  })
})
