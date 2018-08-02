var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

//
function add (a) {
  return function (b) {
    return a + b
  }
}

add(5)(2) // -> 7
subtract(5)(2) // -> 3

bugsnagClient.notify(new Error('surround me'))

function subtract (a) {
  return function (b) {
    return add(a)(-b)
  }
}
