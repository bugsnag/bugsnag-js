var Bugsnag = require('@bugsnag/node')
Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  sessionSummaryInterval: 1000
})

for (var i = 0; i < 50; i++) Bugsnag.startSession()
setTimeout(function () {
  for (var i = 0; i < 50; i++) Bugsnag.startSession()
}, 1500)

// keep the process open a little bit so that the session has time to get sent
setTimeout(function () {}, 5000)
