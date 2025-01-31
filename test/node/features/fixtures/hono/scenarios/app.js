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

app.get('/', (c) => {
    return c.text('Hello from Hono!')
})

app.get('/handled', async (c, next) => {
    Bugsnag.notify(new Error('unresolveable musical differences'));
    await next();
});

serve({
    fetch: app.fetch,
    port: 80
});
