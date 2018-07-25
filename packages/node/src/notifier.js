const name = 'Bugsnag Node'
const version = '__VERSION__'
const url = 'prototypeeeee'

const Client = require('@bugsnag/core/client')
const { reduce } = require('@bugsnag/core/lib/es-utils')

const delivery = require('@bugsnag/delivery-node')

// extend the base config schema with some node-specific options
const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-node-surrounding-code'),
  require('@bugsnag/plugin-node-in-project'),
  require('@bugsnag/plugin-strip-project-root'),
  require('@bugsnag/plugin-server-session')
]

module.exports = (opts, userPlugins = []) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // allow plugins to augment the schema with their own options
  const pls = [].concat(plugins).concat(userPlugins)
  const finalSchema = reduce(pls, (accum, plugin) => {
    if (!plugin.configSchema) return accum
    return Object.assign({}, accum, plugin.configSchema)
  }, schema)

  const bugsnag = new Client({ name, version, url }, finalSchema)

  bugsnag.delivery(delivery())
  bugsnag.configure(opts)

  pls.forEach(pl => bugsnag.use(pl))

  return bugsnag
}
