var Bugsnag = require('@bugsnag/node')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

var error = new Error('I am the error')
error.cause = new Error('I am the cause')

Bugsnag.notify(error)
