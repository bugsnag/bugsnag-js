var fs = require('fs')
var Bugsnag = require('@bugsnag/node')

var conf = Bugsnag.Configuration.load()
conf.apiKey = process.env.BUGSNAG_API_KEY,
conf.endpoints = {
  notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
  sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
}
conf.releaseStage = 'staging'

Bugsnag.init(conf)
Bugsnag.notify(new Error('nope'))
