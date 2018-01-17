import bugsnag from "../.."

try {
  const reports: any[] = []
  const client = bugsnag({
    apiKey: '123',
    beforeSend: [],
    autoNotify: true,
    endpoint: 'http://localhost:55854',
    notifyReleaseStages: [ 'staging', 'production' ],
    releaseStage: 'production',
    maxEvents: 10,
    autoCaptureSessions: false
  })
  const noop = () => {}

  client.transport({
    name: 'test transport',
    sendReport: (logger, config, report) => {
      reports.push(report)
    },
    sendSession: (logger, config, report) => {}
  })
  client.sessionDelegate({ startSession: client => client })
  client.logger({ debug: noop, info: noop, warn: noop, error: noop })
  client.notify(new Error('badness'))
  client.user = { name: 'ben' }
  client.metaData = { 'info': { a: 10 } }
  window.parent.postMessage(JSON.stringify({ type: 'data', reports: reports }), '*')

  // test some more public facing aspects of the library to verify types
  client.notify('123', { beforeSend: () => false })
  client.notify({ message: 'hi' }, { beforeSend: report => report.ignore() })
  client.use({
    init: (client) => {
      client.leaveBreadcrumb('foo', {}, 'new_type')
      client.notify(
        new client.BugsnagReport('Errrr', 'sad', [], {
          severity: 'warning',
          severityReason: { type: 'somethingSpecial' },
          unhandled: false
        })
      )
      client.config.beforeSend.push(() => false)
      return null
    }
  })
  client.startSession()
} catch (e) {
  window.parent.postMessage(JSON.stringify({ type: 'error', error: e.message }), '*')
}
