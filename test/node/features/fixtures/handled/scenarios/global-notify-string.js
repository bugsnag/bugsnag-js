var Bugsnag = require('@bugsnag/node')
var client = Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

function a () {
  client.notify({ name: 'Error', message: 'make a stacktrace for me' })
}
function b () { a() }
function c () { b() }
c()
