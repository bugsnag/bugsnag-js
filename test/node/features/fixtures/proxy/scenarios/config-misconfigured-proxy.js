var bugsnag = require('@bugsnag/node')
var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  proxy: 'http://not-a-proxy:3128'
})

bugsnagClient.notify(new Error('hi via proxy'))
