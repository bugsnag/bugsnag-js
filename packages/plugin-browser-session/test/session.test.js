const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: sessions', () => {
  it('notifies the session endpoint', (done) => {
    const c = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    c._delivery(client => ({
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

  it('tracks handled/unhandled error counts and sends them in event payloads', (done) => {
    const c = new Client({ apiKey: 'API_KEY' }, undefined, VALID_NOTIFIER)
    let i = 0
    c.use(plugin)
    c._delivery(client => ({
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
    const sessionClient = c.startSession()
    sessionClient.notify(new Error('broke'))
    sessionClient._notify(new Event('err', 'bad', [], undefined, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient._notify(new Event('err', 'bad', [], undefined, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient._notify(new Event('err', 'bad', [], undefined, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient._notify(new Event('err', 'bad', [], undefined, { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
  })

  it('correctly sets releaseStage', (done) => {
    const c = new Client({ apiKey: 'API_KEY', releaseStage: 'foo' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    c._delivery(client => ({
      sendSession: (session, cb) => {
        expect(typeof session).toBe('object')
        expect(session.app.releaseStage).toBe('foo')
        done()
      }
    }))
    c.startSession()
  })

  it('doesn’t send when releaseStage is not in enabledReleaseStages', (done) => {
    const c = new Client({ apiKey: 'API_KEY', releaseStage: 'foo', enabledReleaseStages: ['baz'] }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    c._delivery(client => ({
      sendSession: (session, cb) => {
        expect(true).toBe(false)
      }
    }))
    c.startSession()
    setTimeout(done, 150)
  })

  it('logs a warning when no session endpoint is set', (done) => {
    const c = new Client({
      apiKey: 'API_KEY',
      releaseStage: 'foo',
      endpoints: { notify: '/foo' },
      autoTrackSessions: false
    }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    c._logger({
      warn: msg => {
        expect(msg).toMatch(/session not sent/i)
        done()
      }
    })
    c._delivery(client => ({
      sendSession: (session, cb) => {
        expect(true).toBe(false)
      }
    }))
    c.startSession()
  })

  it('runs sessionPayload callbacks', () => {
    let calls = 0
    const c = new Client({
      apiKey: 'API_KEY'
    }, undefined, VALID_NOTIFIER)
    c._addOnSessionPayload(s => { calls++ })
    c.use(plugin)
    c.startSession()
    expect(calls).toBe(1)
  })

  it('supports pausing and resuming sessions', (done) => {
    const payloads = []
    const c = new Client({
      apiKey: 'API_KEY'
    }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    c._delivery(client => ({
      sendEvent: (p, cb = () => {}) => {
        payloads.push(p)
        cb()
      },
      sendSession: (p, cb = () => {}) => cb()
    }))
    c.notify(new Error('1'))
    c.startSession()
    c.notify(new Error('2'))
    c.pauseSession()
    c.notify(new Error('3'))
    c.resumeSession()
    c.notify(new Error('4'))
    c.startSession()
    c.notify(new Error('5'))
    c._pausedSession = c._session = null
    c.resumeSession()
    c.notify(new Error('6'))

    setTimeout(() => {
      expect(payloads.length).toBe(6)
      expect(payloads[0].events[0]._session).toBe(undefined)
      expect(payloads[1].events[0]._session).toBeDefined()
      expect(payloads[2].events[0]._session).toBe(undefined)
      expect(payloads[3].events[0]._session.id).toBe(payloads[1].events[0]._session.id)
      expect(payloads[4].events[0]._session.id).not.toBe(payloads[3].events[0]._session.id)
      expect(payloads[5].events[0]._session.id).not.toBe(payloads[4].events[0]._session.id)
      done()
    }, 0)
  })
})
