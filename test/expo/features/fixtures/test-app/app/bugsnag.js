import Bugsnag from '@bugsnag/expo'

const endpoints = {
  notify: 'http://bs-local.com:9339/notify',
  sessions: 'http://bs-local.com:9339/sessions'
}

const bugsnagClient = Bugsnag.createClient({
  endpoints: endpoints,
  autoTrackSessions: false
})

export {
    endpoints,
    bugsnagClient
}
