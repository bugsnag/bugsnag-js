var bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

var bugsnagClient = bugsnag(config)

bugsnagClient.notify(new Error('bad things'))
