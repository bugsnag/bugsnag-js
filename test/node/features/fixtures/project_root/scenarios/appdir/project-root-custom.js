var bugsnag = require('@bugsnag/node')
var lodash = require('lodash')
var call = require('../../out')

var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  projectRoot: __dirname
})

// the purpose of this seemingly pointless throttle call is just to make sure the
// error has a stackframe from inside node_modules
call(function () {
  lodash.throttle(function () {
    bugsnagClient.notify(new Error('project root'))
  })()
})
