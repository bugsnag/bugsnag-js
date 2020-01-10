var Bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

Bugsnag.init(config)

go()
  .then(function () {})
  .catch(function (e) {
    Bugsnag.notify(e)
  })

function go() {
  return Promise.reject(new Error('bad things'))
}
