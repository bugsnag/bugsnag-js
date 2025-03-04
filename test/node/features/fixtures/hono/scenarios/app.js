import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import Bugsnag from '@bugsnag/node';
import bugsnagHono from '@bugsnag/plugin-hono';

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

// app.use(middleware.errorHandler)

app.get('/', (c) => {
    return c.text('Hello from Hono!')
})

app.get('/handled', async (c, next) => {
    Bugsnag.notify(new Error('unresolveable musical differences'));
    await next();
});

app.get('/sync', (c, next) => {
    throw new Error('sync')
})
  

app.get('/async', (c) => {
    setTimeout(function () {
        throw new Error('async')
    }, 100)
})

app.get('/next', (c, next) => {
    next(new Error('next'))
})

app.get('/rejection-async', (c) => {
    setTimeout(function () {
        Promise.reject(new Error('reject async'))
    }, 100)
})
    
    
app.get('/string-as-error', async (c, next) => {
    setTimeout(function () {
        next('errrr')
    }, 100)
})

app.use(middleware.errorHandler)

serve({
    fetch: app.fetch,
    port: 80
});
