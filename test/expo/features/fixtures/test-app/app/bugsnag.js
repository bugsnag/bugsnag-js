import bugsnag from '@bugsnag/expo'

const endpoints = {
  notify: 'http://localhost:9339',
  sessions: 'http://localhost:9339'
}

const bugsnagClient = bugsnag({
  endpoints: endpoints,
  autoCaptureSessions: false
})

export {
    endpoints,
    bugsnagClient
}