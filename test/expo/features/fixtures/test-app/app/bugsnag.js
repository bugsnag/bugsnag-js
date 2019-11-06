import Bugsnag, { Configuration } from '@bugsnag/expo'

const endpoints = {
  notify: 'http://bs-local.com:9339',
  sessions: 'http://bs-local.com:9339'
}

function buildConfiguration() {
  var config = Configuration.load()
  config.endpoints = endpoints
  config.autoTrackSessions = false
  return config
}

const bugsnagClient = Bugsnag.createClient(buildConfiguration())

export {
  endpoints,
  bugsnagClient,
  buildConfiguration
}
