var fs = require('fs')
var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

var intercept = bugsnagClient.getPlugin('intercept')
fs.readFile('does not exist', intercept(function (data) {
  // callback should never get called so the following report is _not_ expected
  bugsnagClient.notify(new Error('nope'))
}))
