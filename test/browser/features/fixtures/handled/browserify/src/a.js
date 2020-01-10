var Bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')

Bugsnag.init(config)

Bugsnag.notify(new Error('bad things'))
