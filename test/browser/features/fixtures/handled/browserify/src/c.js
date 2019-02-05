var bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

var bugsnagClient = bugsnag(config)

go()
  .then(function () {})
  .catch(function (e) {
    bugsnagClient.notify(e)
  })

function go() {
  return Promise.reject(new Error('bad things'))
}
