const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('@bugsnag/core/client')

const delivery = require('@bugsnag/delivery-react-native-js')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
]

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  const bugsnag = new Client({ name, version, url })

  bugsnag.delivery(delivery())
  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  plugins.forEach(pl => bugsnag.use(pl))

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag
}

module.exports['default'] = module.exports
