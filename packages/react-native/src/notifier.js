const NativeModules = require('react-native').NativeModules
const NativeClient = NativeModules.BugsnagReactNative

const name = 'Bugsnag React Native'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const React = require('react')

const Client = require('@bugsnag/core/client')

const delivery = require('@bugsnag/delivery-react-native')
const session = require('@bugsnag/plugin-react-native-session')
const reportSync = require('@bugsnag/plugin-react-native-report-sync')
const clientSync = require('@bugsnag/plugin-react-native-client-sync')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs'),
  require('@bugsnag/plugin-react-native-app-state-breadcrumbs'),
  require('@bugsnag/plugin-react-native-connectivity-breadcrumbs'),
  require('@bugsnag/plugin-react-native-orientation-breadcrumbs')
]

const bugsnagReact = require('@bugsnag/plugin-react')

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // ensure opts is actually an object (at this point it
  // could be null, undefined, a number, a boolean etc.)
  opts = { ...opts }

  const bugsnag = new Client({ name, version, url })

  bugsnag.delivery(client => delivery(client, NativeClient))
  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  bugsnag.use(session, NativeClient)
  bugsnag.use(reportSync, NativeClient)
  bugsnag.use(clientSync, NativeClient)

  plugins.forEach(pl => bugsnag.use(pl))
  bugsnag.use(bugsnagReact, React)

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag.getPlugin('observedClient')
}

module.exports['default'] = module.exports
