var fs = require('fs')
var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

function pRead (path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, function (err, data) {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

var intercept = bugsnagClient.getPlugin('intercept')
pRead('does not exist').catch(intercept())
