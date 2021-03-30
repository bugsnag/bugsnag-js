import Bugsnag from '@bugsnag/expo'

const endpoints = {
  notify: 'http://maze-local:9339/notify',
  sessions: 'http://maze-local:9339/sessions'
}

const bugsnagClient = Bugsnag.createClient({
  endpoints: endpoints,
  autoTrackSessions: false
})

export {
    endpoints,
    bugsnagClient
}
