var fs = require('fs')
var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

var contextualize = bugsnagClient.getPlugin('contextualize')
contextualize(function () {
  fs.createReadStream('does not exist')
}, {
  metaData: {
    subsystem: { name: 'fs reader', widgetsAdded: 'cat,dog,mouse' }
  }
})
