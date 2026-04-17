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

app.get('/post-body', async (c) => {
    const response = await app.fetch('http://127.0.0.1/post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ a: 1, b: 2 })
    })
    return response;
})

app.post('/post', async (c) => {
    await c.req.raw.json();
    return c.json({});
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
