import bugsnag from '@bugsnag/expo'

const endpoints = {
  notify: 'http://bs-local.com:9339',
  sessions: 'http://bs-local.com:9339'
}

const bugsnagClient = bugsnag({
  endpoints: endpoints,
  autoCaptureSessions: false
})

export {
    endpoints,
    bugsnagClient
}