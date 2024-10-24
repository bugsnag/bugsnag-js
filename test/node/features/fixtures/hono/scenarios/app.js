import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import Bugsnag from '@bugsnag/js';
// import { createServer } from 'node:http2'
// Bugsnag.start({
//     apiKey: '93ddd9eb8ccf8706fd18fe9d74a2dcd8',
// });
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
