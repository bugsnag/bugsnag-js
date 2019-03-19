const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'
const { Constants } = require('expo')

const Client = require('@bugsnag/core/client')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection')
]

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // ensure opts is actually an object (at this point it
  // could be null, undefined, a number, a boolean etc.)
  opts = { ...opts }

  // attempt to fetch apiKey from app.json if we didn't get one explicitly passed
  if (!opts.apiKey &&
    Constants.manifest.extra &&
    Constants.manifest.extra.bugsnag &&
    Constants.manifest.extra.bugsnag.apiKey) {
    opts.apiKey = Constants.manifest.extra.bugsnag.apiKey
  }

  const bugsnag = new Client({ name, version, url })

  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  plugins.forEach(pl => bugsnag.use(pl))

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag
}

module.exports['default'] = module.exports
