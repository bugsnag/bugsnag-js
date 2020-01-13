const Bugsnag = require('@bugsnag/js')
const express = require('express')
const { readFileSync } = require('fs')

Bugsnag.init(process.env.BUGSNAG_API_KEY)
Bugsnag.use(require('@bugsnag/plugin-express'))

const app = express()
const { requestHandler, errorHandler } = Bugsnag.getPlugin('express')

app.use(requestHandler)

app.use('/static', express.static(`${__dirname}/static`))

const index = readFileSync('./views/index.html', 'utf8')
app.get('/', (req, res) => {
  res.send(index)
})

app.post('/crash', (req, res) => {
  setTimeout(() => { throw new Error('Uh oh') })
})

app.post('/unhandled', (req, res) => {
  throw new Error('Invalid DSL syntax')
})

app.post('/handled', (req, res) => {
  req.bugsnag.notify(new Error('Could not connect to xyz service'))
  res.sendStatus(503)
})

app.post('/add-info', (req, res, next) => {
  req.bugsnag.setUser('123', 'jim@jim.com', 'jim')
  next(new Error('Cannot load Jim’s items'))
})

app.use(errorHandler)

app.listen(9871, () => {
  console.log('Example app listening at http://localhost:9871')
})
