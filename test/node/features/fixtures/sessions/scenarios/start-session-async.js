var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  sessionSummaryInterval: 1000
})

for (var i = 0; i < 50; i++) bugsnagClient.startSession()
setTimeout(function () {
  for (var i = 0; i < 50; i++) bugsnagClient.startSession()
}, 1500)

// keep the process open a little bit so that the session has time to get sent
setTimeout(function () {}, 5000)
