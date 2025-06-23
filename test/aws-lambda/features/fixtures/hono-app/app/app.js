const Hono = require('hono').Hono
const Bugsnag = require('@bugsnag/js')

const app = new Hono()

const middleware = Bugsnag.getPlugin('hono')
app.use(middleware.requestHandler)
app.use(middleware.errorHandler)

// Replace the built-in error handler with one that returns JSON. This allows us
// to assert against it much more easily than the default HTML response
app.use(async (c, next) => {
  await next()

  if (c.error) {
    c.status(500)
    return c.json({
      message: c.error.message,
      type: c.error.constructor.name,
      stacktrace: c.error.stack.split('\n')
    })
  }
})

app.get('/', (c) => {
  return c.json({ message: 'hello world!' })
})

app.get('/handled', (c, next) => {
  Bugsnag.notify(new Error('unresolveable musical differences'))
  c.status(200)
  return c.json({ message: 'did not crash :)' })
})

app.get('/unhandled', (c) => {
  throw new Error('sync')
})

app.get('/unhandled-async', async (c) => {
  setTimeout(() => {
    throw new Error('async')
  }, 50)

  await new Promise((resolve) => setTimeout(resolve, 100))

  return c.json({ message: 'threw an async error' })
})

app.get('/promise-rejection', (c) => {
  Promise.reject(new Error('reject'))
})

app.get('/throw-non-error', (c) => {
  throw 1
})

module.exports = app
