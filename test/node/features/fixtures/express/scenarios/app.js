var Bugsnag = require('@bugsnag/node')
var bugsnagExpress = require('@bugsnag/plugin-express')
var express = require('express')

Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

Bugsnag.use(bugsnagExpress)

var middleware = Bugsnag.getPlugin('express')

var app = express()

app.use(middleware.requestHandler)

// If the server hasn't started sending something within 2 seconds
// it probably won't. So end the request and hurry the failing test
// along.
app.use(function (req, res, next) {
  setTimeout(function () {
    if (!res.headersSent) return res.sendStatus(500)
  }, 2000)
  next()
})

app.get('/', function (req, res) {
  res.end('ok')
})

app.get('/sync', function (req, res) {
  throw new Error('sync')
})

app.get('/async', function (req, res) {
  setTimeout(function () {
    throw new Error('async')
  }, 100)
})

app.get('/next', function (req, res, next) {
  next(new Error('next'))
})

app.get('/rejection-sync', function (req, res, next) {
  Promise.reject(new Error('reject sync')).catch(next)
})

app.get('/rejection-async', function (req, res, next) {
  setTimeout(function () {
    Promise.reject(new Error('reject async')).catch(next)
  }, 100)
})

app.get('/string-as-error', function (req, res, next) {
  next('errrr')
})

app.get('/throw-non-error', function (req, res, next) {
  throw 1 // eslint-disable-line
})

app.use(middleware.errorHandler)

app.listen(80)
