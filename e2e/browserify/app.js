try {
  var bugsnag = require('../../')
  var reports = []
  var client = bugsnag({
    apiKey: 'aaaa-aaaa-aaaa-aaaa',
    endpoints: { notify: 'http://localhost:55854', sessions: 'http://localhost:55854/sessions' }
  })
  client.transport({
    sendReport: function (logger, config, report) {
      reports.push(report)
    },
    sendSession: function (logger, config, sessions) {
    }
  })
  client.notify(new Error('badness'))
  window.parent.postMessage(JSON.stringify({ type: 'data', reports: reports }), '*')
} catch (e) {
  window.parent.postMessage(JSON.stringify({ type: 'error', error: e }), '*')
}
