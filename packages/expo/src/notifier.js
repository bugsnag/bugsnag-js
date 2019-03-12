const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('@bugsnag/core/client')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-expo-device')
]

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  const bugsnag = new Client({ name, version, url })

  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  plugins.forEach(pl => bugsnag.use(pl))

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag
}

module.exports['default'] = module.exports
