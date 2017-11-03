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
    eventWindowSize: 100,
    maxEventsPerWindow: 100,
    maxDuplicateEventsPerWindow: 10,
    maxBreadcrumbs: 30,
    projectRoot: '/foo/bar'
  })
  const noop = () => {}

  client.transport({
    name: 'test transport',
    sendReport: (config, report) => {
      reports.push(report)
    }
  })
  client.logger({ debug: noop, info: noop, warn: noop, error: noop })
  client.notify(new Error('badness'))
  window.parent.postMessage(JSON.stringify({ type: 'data', reports: reports }), '*')

  // test some more public facing aspects of the library to verify types
  client.notify('123', { beforeSend: () => false })
  client.notify({ message: 'hi' }, { beforeSend: report => report.ignore() })
  client.use({
    init: (client, Report, Breadcrumb) => {
      client.leaveBreadcrumb(new Breadcrumb('custom type', 'nnnname'))
      client.notify(
        new Report('Errrr', 'sad', [], {
          severity: 'warning',
          severityReason: { type: 'somethingSpecial' },
          unhandled: false
        })
      )
      client.config.beforeSend.push(() => false)
    }
  })
} catch (e) {
  window.parent.postMessage(JSON.stringify({ type: 'error', error: e }), '*')
}
