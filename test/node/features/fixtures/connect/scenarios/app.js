var Bugsnag = require('@bugsnag/node')
var bugsnagExpress = require('@bugsnag/plugin-express')
var connect = require('connect')

Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

Bugsnag.use(bugsnagExpress)

var middleware = Bugsnag.getPlugin('express')

var app = connect()

app.use(middleware.requestHandler)

// If the server hasn't started sending something within 2 seconds
// it probably won't. So end the request and hurry the failing test
// along.
app.use(function (req, res, next) {
  setTimeout(function () {
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('Internal server error')
    }
  }, 2000)
  next()
})

app.use(function (req, res, next) {
  if (req.url !== '/') return next()
  res.end('ok')
})

app.use(function (req, res, next) {
  if (req.url !== '/sync') return next()
  throw new Error('sync')
})

app.use(function (req, res, next) {
  if (req.url !== '/async') return next()
  setTimeout(function () {
    throw new Error('async')
  }, 100)
})

app.use(function (req, res, next) {
  if (req.url !== '/next') return next()
  next(new Error('next'))
})

app.use(function (req, res, next) {
  if (req.url !== '/rejection-sync') return next()
  Promise.reject(new Error('reject sync')).catch(next)
})

app.use(function (req, res, next) {
  if (req.url !== '/rejection-async') return next()
  setTimeout(function () {
    Promise.reject(new Error('reject async')).catch(next)
  }, 100)
})

app.use(function (req, res, next) {
  if (req.url !== '/string-as-error') return next()
  next('errrr')
})

app.use(function (req, res, next) {
  if (req.url !== '/throw-non-error') return next()
  throw 1 // eslint-disable-line
})

app.use(middleware.errorHandler)

app.listen(80)
