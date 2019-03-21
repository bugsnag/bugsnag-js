const { describe, it, expect } = global

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Emitter = require('events')
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: server sessions', () => {
  it('should send the session report', done => {
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
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({
      apiKey: 'aaaa-aaaa-aaaa-aaaa'
    })
    c.delivery(client => ({
      sendReport: () => {},
      sendSession: (session, cb = () => {}) => {
        expect(session.sessionCounts.length).toBe(1)
        expect(session.sessionCounts[0].sessionsStarted).toBe(123)
        done()
      }
    }))

    c.configure()
    c.use(plugin)
    c.startSession()
  })

  it('should not send the session report when releaseStage is not in notifyReleaseStages', done => {
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

    const c = new Client(VALID_NOTIFIER)
    c.setOptions({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      logger: {
        debug: () => {},
        info: () => {},
        warn: (msg) => {
          expect(msg).toBe('Session not sent due to releaseStage/notifyReleaseStages configuration')
          setTimeout(done, 150)
        },
        error: () => {}
      },
      endpoints: { notify: 'bloo', sessions: 'blah' },
      releaseStage: 'qa',
      notifyReleaseStages: [ 'production' ]
    })
    c.delivery(client => ({
      sendReport: () => {},
      sendSession: (session, cb = () => {}) => {
        // no session should be sent
        expect(true).toBe(false)
      }
    }))

    c.configure()
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

    const c = new Client(VALID_NOTIFIER)
    c.setOptions({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      endpoints: { notify: 'bloo', sessions: 'blah' },
      notifyReleaseStages: null,
      releaseStage: 'qa',
      appType: 'server',
      appVersion: '1.2.3'
    })

    // this is normally set by a plugin
    c.device = { hostname: 'test-machine.local' }

    c.delivery(client => ({
      sendReport: () => {},
      sendSession: (session, cb = () => {}) => {
        expect(session.sessionCounts.length).toBe(1)
        expect(session.sessionCounts[0].sessionsStarted).toBe(123)
        expect(session.app).toEqual({ version: '1.2.3', releaseStage: 'qa', type: 'server' })
        expect(session.device).toEqual({ hostname: 'test-machine.local' })
        done()
      }
    }))

    c.configure()
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

    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.configure()
    c.use(plugin)

    c.leaveBreadcrumb('tick')
    c.metaData = { datetime: { tz: 'GMT+1' } }

    const sessionClient = c.startSession()

    sessionClient.leaveBreadcrumb('tock')
    sessionClient.metaData = { ...sessionClient.metaData, other: { widgetsAdded: 'cat,dog,mouse' } }

    expect(c.breadcrumbs.length).toBe(1)
    expect(Object.keys(c.metaData).length).toBe(1)
    expect(sessionClient.breadcrumbs.length).toBe(2)
    expect(Object.keys(sessionClient.metaData).length).toBe(2)
  })
})
