const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const React = require('react')
const Constants = require('expo-constants').default

const Client = require('@bugsnag/core/client')

const delivery = require('@bugsnag/delivery-expo')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-expo-device'),
  require('@bugsnag/plugin-expo-app'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs'),
  require('@bugsnag/plugin-react-native-app-state-breadcrumbs'),
  require('@bugsnag/plugin-react-native-connectivity-breadcrumbs'),
  require('@bugsnag/plugin-react-native-orientation-breadcrumbs'),
  require('@bugsnag/plugin-browser-session')
]

const bugsnagReact = require('@bugsnag/plugin-react')

// The NetInfo module makes requests to this URL to detect if the device is connected
// to the internet. We don't want these requests to be recorded as breadcrumbs.
// see https://github.com/react-native-community/react-native-netinfo/blob/d39b18c61e220d518d8403b6f4f4ab5bcc8c973c/src/index.ts#L16
const NET_INFO_REACHABILITY_URL = 'https://clients3.google.com/generate_204'

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // ensure opts is actually an object (at this point it
  // could be null, undefined, a number, a boolean etc.)
  opts = { ...opts }

  // attempt to fetch apiKey from app.json if we didn't get one explicitly passed
  if (!opts.apiKey &&
    Constants.manifest &&
    Constants.manifest.extra &&
    Constants.manifest.extra.bugsnag &&
    Constants.manifest.extra.bugsnag.apiKey) {
    opts.apiKey = Constants.manifest.extra.bugsnag.apiKey
  }

  const bugsnag = new Client({ name, version, url })

  bugsnag.delivery(delivery)
  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  plugins.forEach(pl => {
    switch (pl.name) {
      case 'networkBreadcrumbs':
        bugsnag.use(pl, () => [
          bugsnag.config.endpoints.notify,
          bugsnag.config.endpoints.sessions,
          Constants.manifest.logUrl,
          NET_INFO_REACHABILITY_URL
        ])
        break
      default:
        bugsnag.use(pl)
    }
  })
  bugsnag.use(bugsnagReact, React)

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag.config.autoCaptureSessions
    ? bugsnag.startSession()
    : bugsnag
}

module.exports['default'] = module.exports
