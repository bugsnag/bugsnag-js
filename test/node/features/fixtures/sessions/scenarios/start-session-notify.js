var Bugsnag = require('@bugsnag/node')
Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  sessionSummaryInterval: 1000
})

var sessionClient = Bugsnag.startSession()
setTimeout(function () {
  sessionClient.notify(new Error('in a session'))
}, 1500)

// keep the process open a little bit so that the session has time to get sent
setTimeout(function () {}, 5000)
