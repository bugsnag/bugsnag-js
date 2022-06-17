var Bugsnag = require('@bugsnag/node')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

Bugsnag.notify(new Error('I am the error', { cause: new Error('I am the cause') }))
