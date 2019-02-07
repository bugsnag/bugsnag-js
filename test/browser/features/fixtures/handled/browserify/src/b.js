var bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

var bugsnagClient = bugsnag(config)

try {
  foo.bar()
} catch (e) {
  bugsnagClient.notify(e)
}
