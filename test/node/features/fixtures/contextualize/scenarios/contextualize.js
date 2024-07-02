var fs = require('fs')
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
  console.log('manual notify')
  Bugsnag.leaveBreadcrumb('manual notify', { message: 'manual notify' })
  Bugsnag.notify(new Error('manual notify'))
}, function (event) {
  event.addMetadata('subsystem', { name: 'manual notify' })
})

contextualize(function () {
  Bugsnag.leaveBreadcrumb('opening file', { message: 'opening file' })
  setTimeout(function () {
    fs.createReadStream('does not exist')
  }, 100)
}, function (event) {
  event.addMetadata('subsystem', { name: 'fs reader' })
})

