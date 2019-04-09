import bugsnag from '@bugsnag/expo'

const endpoints = {
  notify: 'http://10.0.2.2:9339',
  sessions: 'http://10.0.2.2:9339'
}

const bugsnagClient = bugsnag({
  apiKey: 'MyApiKey',
  endpoints: endpoints
})

export {
    endpoints,
    bugsnagClient
}