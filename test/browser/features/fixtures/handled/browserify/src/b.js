var Bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

Bugsnag.init(config)

try {
  foo.bar()
} catch (e) {
  Bugsnag.notify(e)
}
