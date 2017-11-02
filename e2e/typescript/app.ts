import bugsnag from "../.."

try {
  const reports: any[] = []
  const client = bugsnag({
    apiKey: '123',
    beforeSend: [],
    endpoint: 'http://localhost:55854'
  })

  client.transport({
    name: 'test transport',
    sendReport: (config, report) => {
      reports.push(report)
    }
  })
  client.notify(new Error('badness'))
  window.parent.postMessage(JSON.stringify({ type: 'data', reports: reports }), '*')
} catch (e) {
  window.parent.postMessage(JSON.stringify({ type: 'error', error: e }), '*')
}
