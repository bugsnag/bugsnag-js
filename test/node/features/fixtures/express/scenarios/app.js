var Bugsnag = require('@bugsnag/node')
var bugsnagExpress = require('@bugsnag/plugin-express')
var express = require('express')
var bodyParser = require('body-parser')

const nodeVersion = process.version.match(/^v(\d+\.\d+)/)[1]

const http = parseFloat(nodeVersion) > 14 ? require('node:http') : require('http')

const logUrl = parseFloat(nodeVersion) > 12 
  ? new URL(process.env.BUGSNAG_LOGS_ENDPOINT)
  : require('url').parse(process.env.BUGSNAG_LOGS_ENDPOINT)

function sendLog(level, message) {
  const postData = JSON.stringify({ level, message })

  const options = {
    hostname: logUrl.hostname,
    path: logUrl.pathname,
    port: logUrl.port,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const req = http.request(options)
  req.write(postData)
  req.end()
}

const remoteLogger = {
  debug: (message) => sendLog('debug', message),
  info: (message) => sendLog('info', message),
  warn: (message) => sendLog('warn', message),
  error: (message) => sendLog('error', message)
}

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  featureFlags: [
    { name: 'from config 1', variant: '1234' },
    { name: 'from config 2' },
    { name: 'from config 3', variant: 'SHOULD BE REMOVED' }
  ],
  autoTrackSessions: false,
  plugins: [bugsnagExpress],
  logger: remoteLogger,
})

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

app.get('/oversized', function (req, res, next) {
  function repeat(s, n){
    var a = [];
    while(a.length < n){
        a.push(s);
    }
    return a.join('');
  }

  var big = {};
  var i = 0;
  while (JSON.stringify(big).length < 5*10e5) {
    big['entry'+i] = repeat('long repetitive string', 1000);
    i++;
  }
  req.bugsnag.leaveBreadcrumb('big thing', big);
  req.bugsnag.notify(new Error('oversized'));
  res.end('OK')
})

app.get('/handled', function (req, res, next) {
  req.bugsnag.notify(new Error('handled'))
  res.end('OK')
})

app.post('/bodytest', bodyParser.urlencoded(), function (req, res, next) {
  throw new Error('request body')
})

app.post('/features/unhandled', bodyParser.urlencoded(), function (req, res, next) {
  // the request body is an object of feature flag name -> variant
  const featureFlags = Object.keys(req.body).map(name => ({ name, variant: req.body[name] }))

  req.bugsnag.addFeatureFlags(featureFlags)
  req.bugsnag.clearFeatureFlag('from config 3')

  if (req.body.hasOwnProperty('clearAllFeatureFlags')) {
    req.bugsnag.clearFeatureFlags()
  }

  throw new Error('oh no')
})

app.post('/features/handled', bodyParser.urlencoded(), function (req, res, next) {
  // the request body is an object of feature flag name -> variant
  const featureFlags = Object.keys(req.body).map(name => ({ name, variant: req.body[name] }))

  req.bugsnag.addFeatureFlags(featureFlags)
  req.bugsnag.clearFeatureFlag('from config 3')

  if (req.body.hasOwnProperty('clearAllFeatureFlags')) {
    req.bugsnag.clearFeatureFlags()
  }

  req.bugsnag.notify(new Error('oh no'))
  res.end('OK')
})

app.use(middleware.errorHandler)

app.listen(80)
