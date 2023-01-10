var Bugsnag = require('@bugsnag/node')
var bugsnagRestify = require('@bugsnag/plugin-restify')
var restify = require('restify')
var errors = require('restify-errors')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  plugins: [bugsnagRestify]
})

var middleware = Bugsnag.getPlugin('restify')

var server = restify.createServer()

server.pre(middleware.requestHandler)

server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser())

// If the server hasn't started sending something within 2 seconds
// it probably won't. So end the request and hurry the failing test
// along.
server.use(function (req, res, next) {
  setTimeout(function () {
    if (!res.headersSent) return res.sendStatus(500)
  }, 2000)
  next()
})

server.get('/', function (req, res, next) {
  res.end('ok')
})

server.get('/sync/:message', function (req, res, next) {
  throw new Error(req.params.message)
})

server.get('/async', function (req, res, next) {
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

server.get('/unhandled-rejection-async-callback', function (req, res, next) {
  setTimeout(function () {
    Promise.reject(new Error('unhandled rejection in async callback'))
  }, 100)
  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)
  res.end('OK')
  next()
})

//
// app.get('/string-as-error', function (req, res, next) {
//   next('errrr')
// })

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

server.get('/handled', function (req, res, next) {
  req.bugsnag.notify(new Error('handled'))
  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)
  res.end('OK')
  next()
})

server.post('/bodytest', function (req, res, next) {
  throw new Error('request body')
})

server.on('restifyError', middleware.errorHandler)

server.listen(80)
