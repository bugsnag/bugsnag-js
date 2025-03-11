const Hono = require('hono').Hono
const Bugsnag = require('@bugsnag/js')

const app = new Hono()

const middleware = Bugsnag.getPlugin('hono')
app.use(middleware.requestHandler)

// app.use((c, next) => {
//   next()
//   c.status(500)
//   c.json({
//     message: c.error.message,
//     type: c.error.constructor.name,
//     stacktrace: c.error.stack.split('\n')
//   })
// })

app.use(middleware.errorHandler)

app.get('/', (c) => {
  c.json({ message: 'hello world!' })
})

app.get('/handled', (c, next) => {
  Bugsnag.notify(new Error('unresolveable musical differences'))
  c.status(200)
  c.json({ message: 'did not crash :)' })
})

app.get('/unhandled', (c) => {
  throw new Error('sync')
})

app.get('/unhandled-async', (c) => {
  setTimeout(function () {
    throw new Error('async')
  }, 100)
})

app.get('/promise-rejection', (c) => {
  Promise.reject(new Error('reject'))
})

app.get('/throw-non-error', (c) => {
  // eslint-disable-next-line no-throw-literal
  throw 1
})

module.exports = app
