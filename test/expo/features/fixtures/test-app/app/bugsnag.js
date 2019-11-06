import Bugsnag from '@bugsnag/expo'

const endpoints = {
  notify: 'http://bs-local.com:9339',
  sessions: 'http://bs-local.com:9339'
}

const bugsnagClient = Bugsnag.createClient({
  endpoints: endpoints,
  autoTrackSessions: false
})

export {
  endpoints,
  bugsnagClient
}
