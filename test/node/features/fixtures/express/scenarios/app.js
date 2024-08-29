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

app.get('/sync/:message', function (req, res) {
  throw new Error(req.params.message)
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

app.get('/unhandled-rejection-async-callback', function (req, res, next) {
  setTimeout(function () {
    Promise.reject(new Error('unhandled rejection in async callback'))
  }, 100)
  res.end('OK')
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
  while (JSON.stringify(big).length < 2*10e5) {
    big['entry'+i] = repeat('long repetitive string', 1000);
    i++;
  }
  Bugsnag.leaveBreadcrumb('big thing', big);
  Bugsnag.notify(new Error('oversized'));
  res.end('OK')
})

app.get('/handled', function (req, res, next) {
  Bugsnag.notify(new Error('handled'))
  res.end('OK')
})

app.post('/bodytest', bodyParser.urlencoded(), function (req, res, next) {
  throw new Error('request body')
})

app.post('/features/unhandled', bodyParser.urlencoded(), function (req, res, next) {
  // the request body is an object of feature flag name -> variant
  const featureFlags = Object.keys(req.body).map(name => ({ name, variant: req.body[name] }))

  Bugsnag.addFeatureFlags(featureFlags)
  Bugsnag.clearFeatureFlag('from config 3')

  if (req.body.hasOwnProperty('clearAllFeatureFlags')) {
    Bugsnag.clearFeatureFlags()
  }

  throw new Error('oh no')
})

app.post('/features/handled', bodyParser.urlencoded(), function (req, res, next) {
  // the request body is an object of feature flag name -> variant
  const featureFlags = Object.keys(req.body).map(name => ({ name, variant: req.body[name] }))

  Bugsnag.addFeatureFlags(featureFlags)
  Bugsnag.clearFeatureFlag('from config 3')

  if (req.body.hasOwnProperty('clearAllFeatureFlags')) {
    Bugsnag.clearFeatureFlags()
  }

  Bugsnag.notify(new Error('oh no'))
  res.end('OK')
})

app.get('/breadcrumbs_a', function (req, res) {
  Bugsnag.leaveBreadcrumb('For the first URL', { message: 'For the first URL' })
  throw new Error('Error in /breadcrumbs_a')
})

app.get('/breadcrumbs_b', function (req, res) {
  Bugsnag.leaveBreadcrumb('For the second URL', { message: 'For the second URL' })
  throw new Error('Error in /breadcrumbs_b')
})

app.get('/console_breadcrumbs_a', function (req, res) {
  console.log('For the first URL')
  throw new Error('Error in /console_breadcrumbs_a')
})

app.get('/console_breadcrumbs_b', function (req, res) {
  console.log('For the second URL')
  throw new Error('Error in /console_breadcrumbs_b')
})

app.post('/context-loss',
(req, res, next) => {
  // Context is lost in this middleware because next gets
  // called in the request context without being bound to
  // the async local storage context
  Bugsnag.leaveBreadcrumb('About to parse request body')
  req.rawBody = '';
  req.setEncoding('utf8');

  req.on('data', function(chunk) { 
    req.rawBody += chunk;
  });

  // this event handler gets called without async local storage context
  // the fix body parsing libraries have made is to effectviely wrap this
  // event handler with AsyncResource.bind so that next does get called in
  // the async local storage context. Here for this test we don't do that in order
  // to show how context can be lost and re-gained
  req.on('end', function() {
    Bugsnag.leaveBreadcrumb('context is lost here')
    // next gets called without being bound to the async local storage context
    next();
  });
},
(req, res, next) => {
  Bugsnag.leaveBreadcrumb('so no context here either')
  req.bugsnag.leaveBreadcrumb('but this is fine')
  next();
},
// Explicitly bind the async local storage context to next using the helper middleware
middleware.runInContext,
(req, res, next) => {
  Bugsnag.leaveBreadcrumb('context is regained from here')
  throw new Error('Error in /context-loss')
})

app.use(middleware.errorHandler)

app.listen(80)
