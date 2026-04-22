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
    c.bugsnag.notify(new Error('handled'));
    await next();
});

app.get('/sync', (c) => {
    throw new Error('sync')
})

// Causes the app to crash
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

// This route does not work with local testing, not sure why it's running here
app.get('/throw-non-error', async (c, next) => {
    throw 1 
})

// Causes a 'Context is not finalized' Error if the error handler middleware does not `await next()`
app.post('/post-body', async (c) => {
  await c.req.raw.json();
  c.bugsnag.notify(new Error('error in post body route'));
  return c.json({ a: 'test' });
});

serve({
    fetch: app.fetch,
    port: 80
});

// Keep the process alive
process.on('SIGTERM', () => {
    process.exit(0)
})

process.on('SIGINT', () => {
    process.exit(0)
})
