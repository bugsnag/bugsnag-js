import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import Bugsnag from '@bugsnag/js';

Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY,
    endpoints: {
      notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
      sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
    }
})

const app = new Hono();
app.get('/', (c) => {
    Bugsnag.notify(new Error('unresolveable musical differences'));
    return c.text('Hello Hono!!');
});

serve({
    fetch: app.fetch,
    port: 80
});
console.log("test")
