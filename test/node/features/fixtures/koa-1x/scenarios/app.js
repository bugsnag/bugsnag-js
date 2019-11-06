const Bugsnag = require('@bugsnag/node')
const bugsnagKoa = require('@bugsnag/plugin-koa')
const Koa = require('koa')

Bugsnag.init({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  }
})
Bugsnag.use(bugsnagKoa)

const middleware = Bugsnag.getPlugin('koa')

const app = new Koa()

// If the server hasn't started sending something within 2 seconds
// it probably won't. So end the request and hurry the failing test
// along.
app.use(function * (next) {
  console.log('[req]', this.url, this.path)
  var ctx = this
  setTimeout(function () {
    if (!ctx.headerSent) ctx.status = 500
  }, 2000)
  yield next
})

app.use(function * (next) {
  if (this.path === '/error-before-handler') {
    throw new Error('nope')
  } else {
    yield next
  }
})

app.use(middleware.requestHandler.v1)

app.use(function * (next) {
  if (this.path === '/') {
    this.body = 'ok'
  } else if (this.path === '/err') {
    throw new Error('noooop')
  } else if (this.path === '/ctx-throw') {
    this.throw(500, 'thrown')
  } else if (this.path === '/ctx-throw-400') {
    this.throw(400, 'thrown')
  } else if (this.path === '/throw-non-error') {
    throw 'error' // eslint-disable-line
  } else {
    yield next
  }
})

app.on('error', middleware.errorHandler)

app.listen(80)
