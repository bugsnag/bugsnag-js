const Bugsnag = require('@bugsnag/js')
const Koa = require('koa')
const router = require('koa-router')
const serve = require('koa-static')
const mount = require('koa-mount')
const { readFileSync } = require('fs')
const BugsnagPluginKoa = require('@bugsnag/plugin-koa')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginKoa]
})

const app = new Koa()
const { requestHandler, errorHandler } = Bugsnag.getPlugin('koa')

app.use(requestHandler)

app.use(mount('/static', serve(`${__dirname}/static`)))

const index = readFileSync('./views/index.html', 'utf8')

app.use(
  router()
    .get('/', (ctx, next) => {
      ctx.body = index
    })
    .post('/crash', (ctx, next) => {
      setTimeout(() => { throw new Error('Oh no!') })
      return new Promise(() => {})
    })
    .post('/unhandled', (ctx, next) => {
      return Promise.reject(new Error('Invalid DSL syntax'))
    })
    .post('/handled', (ctx, next) => {
      ctx.bugsnag.notify(new Error('Could not connect to xyz service'))
      ctx.response.status = 503
    })
    .post('/add-info', (ctx, next) => {
      ctx.bugsnag.setUser('123', 'jim@jim.com', 'jim')
      throw new Error('Cannot load Jim’s items')
    })
    .routes()
)

app.on('error', errorHandler)

app.listen(9872, () => {
  console.log('Example app listening at http://localhost:9872')
})
