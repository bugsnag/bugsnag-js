var Bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

Bugsnag.start(config)

try {
  foo.bar()
} catch (e) {
  Bugsnag.notify(e)
}
