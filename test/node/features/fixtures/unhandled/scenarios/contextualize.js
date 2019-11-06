var fs = require('fs')
var Bugsnag = require('@bugsnag/node')
Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

var contextualize = Bugsnag.getPlugin('contextualize')
contextualize(function () {
  fs.createReadStream('does not exist')
}, function (event) {
  event.addMetadata('subsystem', { name: 'fs reader', widgetsAdded: 'cat,dog,mouse' })
})
