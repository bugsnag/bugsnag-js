var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  autoCaptureSessions: false,
  sessionSummaryInterval: 1000
})

bugsnagClient.startSession()

// keep the process open a little bit so that the session has time to get sent
setTimeout(function () {}, 5000)
