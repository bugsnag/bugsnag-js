var Bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

Bugsnag.start(config)

Bugsnag.notify(new Error('bad things'))
