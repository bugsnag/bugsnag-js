var Bugsnag = require('@bugsnag/node')
Bugsnag.start({
  reportUnhandledPromiseRejectionsAsHandled: true,
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

Promise.reject(new Error('not handled'))
