import bugsnag from '../../'
try {
  var reports = []
  var client = bugsnag({
    apiKey: 'aaaa-aaaa-aaaa-aaaa',
    endpoint: 'http://localhost:55854'
  })
  client.transport({
    sendReport: function (logger, config, report) {
      reports.push(report)
    }
  })
  client.notify(new Error('badness'))
  window.parent.postMessage(JSON.stringify({ type: 'data', reports: reports }), '*')
} catch (e) {
  window.parent.postMessage(JSON.stringify({ type: 'error', error: e }), '*')
}
