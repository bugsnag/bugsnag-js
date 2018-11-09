const restify = require('restify')
const bugsnag = require('@bugsnag/js')
const { readFileSync } = require('fs')

const bugsnagClient = bugsnag(process.env.BUGSNAG_API_KEY)
bugsnagClient.use(require('@bugsnag/plugin-restify'))

const server = restify.createServer()
const { requestHandler, errorHandler } = bugsnagClient.getPlugin('restify')

const index = readFileSync(`${__dirname}/views/index.html`, 'utf8')

server.pre(requestHandler)

server.get('/', (req, res, next) => {
  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)
  res.end(index)
  next()
})

server.post('/handled', (req, res, next) => {
  req.bugsnag.notify(new Error('Could not connect to xyz service'))
  res.writeHead(503)
  res.end('Service not available')
  next()
})

server.post('/unhandled', (req, res, next) => {
  next(new Error('Invalid DSL syntax'))
})

server.post('/add-info', (req, res, next) => {
  req.bugsnag.user = { id: '123', name: 'jim' }
  next(new Error('Cannot load Jim’s items'))
})

server.post('/crash', (req, res, next) => {
  setTimeout(() => { throw new Error('Uh oh!') })
})

server.get('/static/*', restify.plugins.serveStatic({
  directory: './static',
  appendRequestPath: false
}))

server.on('restifyError', errorHandler)

server.listen(9873, () => {
  console.log('Example app listening at http://localhost:9873')
})
