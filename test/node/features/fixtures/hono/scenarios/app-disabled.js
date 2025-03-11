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
    autoDetectErrors: false,
    plugins: [bugsnagHono],
})

const app = new Hono();

const middleware = Bugsnag.getPlugin('hono')

app.use(middleware.requestHandler)

app.use(middleware.errorHandler)

app.get('/handled', (c) => {
    Bugsnag.notify(new Error('unresolveable musical differences'));
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
  
  app.get('/throw-non-error', (c) => {
    throw 1 // eslint-disable-line
  })

serve({
    fetch: app.fetch,
    port: 80
});