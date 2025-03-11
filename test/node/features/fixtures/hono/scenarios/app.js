const Bugsnag = require('@bugsnag/node')
const bugsnagHono = require('@bugsnag/plugin-hono')
const Hono = require('hono').Hono
const serve = require('@hono/node-server').serve

Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY,
    endpoints: {
      notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
      sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
    },
    plugins: [bugsnagHono],
})

const app = new Hono();
const middleware = Bugsnag.getPlugin('hono')

app.use(middleware.requestHandler)

app.use(middleware.errorHandler)

app.get('/', (c) => {
    return c.text('Hello from Hono!')
})

app.get('/handled', async (c, next) => {
    Bugsnag.notify(new Error('handled'));
    await next();
});

app.get('/sync', (c) => {
    throw new Error('sync')
})

app.get('/async', (c) => {
    setTimeout(function () {
        throw new Error('async')
    }, 100)
})

app.get('/rejection-sync', (c) => {
    Promise.reject(new Error('reject sync'))
})

app.get('/rejection-async', (c) => {
    setTimeout(function () {
        Promise.reject(new Error('reject async'))
    }, 100)
})

app.get('/throw-non-error', async (c, next) => {
    throw 1 
})

serve({
    fetch: app.fetch,
    port: 80
});
