const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: sessions', () => {
  it('notifies the session endpoint', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'API_KEY' })
    c.configure()
    c.use(plugin)
    c.delivery(client => ({
      sendSession: (session, cb) => {
        expect(typeof session).toBe('object')
        expect(session.notifier).toEqual(VALID_NOTIFIER)
        expect(session.sessions.length).toBe(1)
        expect(session.sessions[0].id).toBeTruthy()
        expect(session.sessions[0].id.length).toBeGreaterThan(10)
        expect(session.sessions[0].startedAt).toBeTruthy()
        done()
      }
    }))
    c.startSession()
  })

  it('tracks handled/unhandled error counts and sends them in error payloads', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'API_KEY' })
    c.configure()
    let i = 0
    c.use(plugin)
    c.delivery(client => ({
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
    const sessionClient = c.startSession()
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new c.BugsnagEvent('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new c.BugsnagEvent('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new c.BugsnagEvent('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new c.BugsnagEvent('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
  })

  it('correctly infers releaseStage', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'API_KEY', releaseStage: 'foo' })
    c.configure()
    c.use(plugin)
    c.delivery(client => ({
      sendSession: (session, cb) => {
        expect(typeof session).toBe('object')
        expect(session.app.releaseStage).toBe('foo')
        done()
      }
    }))
    c.startSession()
  })

  it('doesn’t send when releaseStage is not in enabledReleaseStages', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'API_KEY', releaseStage: 'foo', enabledReleaseStages: ['baz'] })
    c.configure()
    c.use(plugin)
    c.delivery(client => ({
      sendSession: (session, cb) => {
        expect(true).toBe(false)
      }
    }))
    c.startSession()
    setTimeout(done, 150)
  })

  it('rejects config when session endpoint is not set', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({
      apiKey: 'API_KEY',
      releaseStage: 'foo',
      endpoints: { notify: '/foo' },
      autoTrackSessions: false
    })
    expect(() => c.configure()).toThrowError(
      /"endpoints" should be an object containing endpoint URLs { notify, sessions }/
    )
  })
})
