var bugsnag = require('@bugsnag/node')
bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  autoDetectErrors: false
})

throw new Error('not handled')
