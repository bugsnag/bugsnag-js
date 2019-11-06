var Bugsnag = require('@bugsnag/node')
Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

go()
  .then(function () {})
  .catch(function (e) {
    Bugsnag.notify(e)
  })

function go () {
  return Promise.reject(new Error('bad things'))
}
