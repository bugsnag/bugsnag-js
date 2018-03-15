// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../sessions')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: sessions', () => {
  it('notifies the session endpoint', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.configure({ apiKey: 'API_KEY' })
    c.use(plugin)
    c.transport({
      sendSession: (logger, config, session, cb) => {
        expect(typeof session).toBe('object')
        expect(session.notifier).toEqual(VALID_NOTIFIER)
        expect(session.sessions.length).toBe(1)
        expect(session.sessions[0].id).toBeTruthy()
        expect(session.sessions[0].id.length).toBeGreaterThan(10)
        expect(session.sessions[0].startedAt).toBeTruthy()
        done()
      }
    })
    c.startSession()
  })

  it('runs client.beforeSession[] callbacks', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.configure({ apiKey: 'API_KEY' })
    c.use(plugin)
    c.beforeSession.push(client => {
      expect(client.session).toBeTruthy()
      done()
    })
    c.startSession()
  })

  it('tracks handled/unhandled error counts and sends them in error payloads', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.configure({ apiKey: 'API_KEY' })
    let i = 0
    c.use(plugin)
    c.transport({
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
    const sessionClient = c.startSession()
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new c.BugsnagReport('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new c.BugsnagReport('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new Error('broke'))
    sessionClient.notify(new c.BugsnagReport('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
    sessionClient.notify(new c.BugsnagReport('err', 'bad', [], { unhandled: true, severity: 'error', severityReason: { type: 'unhandledException' } }))
  })

  it('correctly infers releaseStage', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.configure({ apiKey: 'API_KEY', releaseStage: 'foo' })
    c.use(plugin)
    c.transport({
      sendSession: (logger, config, session, cb) => {
        expect(typeof session).toBe('object')
        expect(session.app.releaseStage).toBe('foo')
        done()
      }
    })
    c.startSession()
  })

  it('doesnt’t send when releaseStage is not in notifyReleaseStages', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.configure({ apiKey: 'API_KEY', releaseStage: 'foo', notifyReleaseStages: [ 'baz' ] })
    c.use(plugin)
    c.transport({
      sendSession: (logger, config, session, cb) => {
        expect(true).toBe(false)
      }
    })
    c.startSession()
    setTimeout(done, 150)
  })
})
