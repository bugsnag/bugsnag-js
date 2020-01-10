var Bugsnag = require('@bugsnag/node')
var lodash = require('lodash')

Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  projectRoot: null
})

// the purpose of this seemingly pointless throttle call is just to make sure the
// error has a stackframe from inside node_modules
lodash.throttle(function () {
  Bugsnag.notify(new Error('project root'))
})()
