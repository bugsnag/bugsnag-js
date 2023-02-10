var Bugsnag = require('@bugsnag/node')
Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

var contextualize = Bugsnag.getPlugin('contextualize')
contextualize(function () {
  Promise.reject(new Error('unhandled rejection'))
}, function (event) {
  event.addMetadata('subsystem', { name: 'fs reader', widgetsAdded: 'cat,dog,mouse' })
})
