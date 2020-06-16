require('./lib/bugsnag');
const Bugsnag = require ('@bugsnag/js');
const next = require('next')
const express = require('express')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handler = app.getRequestHandler()

var middleware = Bugsnag.getPlugin('express')

app.prepare().then(() => {

  express()
    .use(middleware.requestHandler)
    .get('/custom-server/bad', (req, res) => {
      throw new Error('exception in custom express server (outside next.js)')
    })
    .use(middleware.errorHandler)
    .use(handler)
    .listen(port, (err) => {
      if (err) {
        throw err
      }
      console.log(`> Ready on http://localhost:${port}`)
    })
})
