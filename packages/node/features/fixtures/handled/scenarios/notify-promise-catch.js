var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

go()
  .then(function () {})
  .catch(function (e) {
    bugsnagClient.notify(e)
  })

function go () {
  return Promise.reject(new Error('bad things'))
}
