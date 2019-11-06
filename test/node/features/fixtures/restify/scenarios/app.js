var Bugsnag = require('@bugsnag/node')
var bugsnagRestify = require('@bugsnag/plugin-restify')
var restify = require('restify')
var errors = require('restify-errors')

Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})

Bugsnag.use(bugsnagRestify)

var middleware = Bugsnag.getPlugin('restify')

var server = restify.createServer()

server.pre(middleware.requestHandler)

// If the server hasn't started sending something within 2 seconds
// it probably won't. So end the request and hurry the failing test
// along.
server.use(function (req, res, next) {
  setTimeout(function () {
    if (!res.headersSent) return res.sendStatus(500)
  }, 2000)
  next()
})

server.get('/', function (req, res) {
  res.end('ok')
})

server.get('/sync', function (req, res) {
  throw new Error('sync')
})

server.get('/async', function (req, res) {
  setTimeout(function () {
    throw new Error('async')
  }, 100)
})

server.get('/next', function (req, res, next) {
  next(new Error('next'))
})

server.get('/rejection-sync', function (req, res, next) {
  Promise.reject(new Error('reject sync')).catch(next)
})

server.get('/rejection-async', function (req, res, next) {
  setTimeout(function () {
    Promise.reject(new Error('reject async')).catch(next)
  }, 100)
})
//
// app.get('/string-as-error', function (req, res, next) {
//   next('errrr')
// })
//
server.get('/throw-non-error', function (req, res, next) {
  throw 1 // eslint-disable-line
})

server.get('/not-found', function (req, res, next) {
  var err = new errors.NotFoundError('not there')
  return next(err)
})

server.get('/internal', function (req, res, next) {
  var err = new errors.InternalServerError('oh noes!')
  return next(err)
})

server.on('restifyError', middleware.errorHandler)

server.listen(80)
