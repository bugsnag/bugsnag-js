const Bugsnag = require('@bugsnag/node')
const bugsnagKoa = require('@bugsnag/plugin-koa')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser');

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  plugins: [bugsnagKoa]
})


const middleware = Bugsnag.getPlugin('koa')

const app = new Koa()

// If the server hasn't started sending something within 2 seconds
// it probably won't. So end the request and hurry the failing test
// along.
app.use(async (ctx, next) => {
  setTimeout(function () {
    if (!ctx.response.headerSent) ctx.response.status = 500
  }, 2000)
  await next()
})

app.use(async (ctx, next) => {
  if (ctx.path === '/error-before-handler') {
    throw new Error('nope')
  } else {
    await next()
  }
})

app.use(middleware.requestHandler)

app.use(bodyParser());

app.use(async (ctx, next) => {
  if (ctx.path === '/') {
    ctx.body = 'ok'
  } else if (ctx.path === '/err') {
    throw new Error('noooop')
  } else if (ctx.path === '/promise-rejection') {
    await Promise.reject(new Error('async noooop'))
  } else if (ctx.path === '/ctx-throw') {
    ctx.throw(500, 'thrown')
  } else if (ctx.path === '/ctx-throw-400') {
    ctx.throw(400, 'thrown')
  } else if (ctx.path === '/throw-non-error') {
    throw 'error' // eslint-disable-line
  } else if (ctx.path === '/handled') {
    ctx.bugsnag.notify(new Error('handled'))
    await next()
  } else if (ctx.path === '/bodytest') {
    throw new Error('request body')
  } else if (ctx.path === '/throw-async-callback') {
    setTimeout(function () {
      throw new Error('error in async callback')
    }, 100)
    ctx.body = 'ok'
  } else if (ctx.path === '/unhandled-rejection-async-callback') {
    setTimeout(function () {
      Promise.reject(new Error('unhandled rejection in async callback'))
    }, 100)
    ctx.body = 'ok'
  } else {
    await next()
  }
})

app.on('error', (err, ctx) => {
  // in the "error-before-handler" test ctx.bugsnag won't exist
  const bugsnag = ctx.bugsnag || Bugsnag

  bugsnag.addMetadata('error_handler', 'before', true)
})

app.on('error', middleware.errorHandler)

app.on('error', (err, ctx) => {
  // in the "error-before-handler" test ctx.bugsnag won't exist
  const bugsnag = ctx.bugsnag || Bugsnag

  // this should not be added to events as error handlers run in the order they
  // were added, so at this point the event has already been sent by the Bugsnag
  // errorHandler
  bugsnag.addMetadata('error_handler', 'after', true)
})

app.listen(80)
