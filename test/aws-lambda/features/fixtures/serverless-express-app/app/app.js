const Bugsnag = require('@bugsnag/js')
const express = require('express')

const app = express()

const middleware = Bugsnag.getPlugin('express')
app.use(middleware.requestHandler)

app.get('/', (request, response) => {
  response.json({ message: 'hello world!' })
})

app.get('/handled', (request, response) => {
  request.bugsnag.notify('no crashing here')

  response.json({ message: 'did not crash :)' })
})

app.get('/unhandled', (request, response) => {
  Bugsnag._client._logger.info('About to throw an error from /unhandled')
  throw new Error('broken :(')
})

app.get('/unhandled-async', (request, response) => {
  setTimeout(function () {
    throw new Error('busted')
  }, 100)
})

app.get('/unhandled-next', (request, response, next) => {
  Bugsnag._client._logger.info('About to throw an error from /unhandled-next')
  next(new Error('borked'))
})

app.get('/promise-rejection', (request, response) => {
  Promise.reject(new Error('abc'))

  response.json({ message: 'xyz' })
})

app.use(middleware.errorHandler)

// Replace the built-in error handler with one that returns JSON. This allows us
// to assert against it much more easily than the default HTML response
app.use((error, request, response, next) => {
  response.status(500)
  response.json({
    message: error.message,
    type: error.constructor.name,
    stacktrace: error.stack.split('\n')
  })
})

module.exports = app
