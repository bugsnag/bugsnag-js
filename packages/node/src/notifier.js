const name = 'Bugsnag Node'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

const { reduce, keys } = require('@bugsnag/core/lib/es-utils')

const delivery = require('@bugsnag/delivery-node')

// extend the base config schema with some node-specific options
const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

// remove autoBreadcrumbs from the config schema
delete schema.enabledBreadcrumbTypes

const pluginSurroundingCode = require('@bugsnag/plugin-node-surrounding-code')
const pluginStripProjectRoot = require('@bugsnag/plugin-strip-project-root')
const pluginInProject = require('@bugsnag/plugin-node-in-project')
const pluginServerSession = require('@bugsnag/plugin-server-session')
const pluginNodeDevice = require('@bugsnag/plugin-node-device')
const pluginNodeUncaughtException = require('@bugsnag/plugin-node-uncaught-exception')
const pluginNodeUnhandledRejection = require('@bugsnag/plugin-node-unhandled-rejection')
const pluginIntercept = require('@bugsnag/plugin-intercept')
const pluginContextualize = require('@bugsnag/plugin-contextualize')

const plugins = [
  pluginSurroundingCode,
  pluginStripProjectRoot,
  pluginInProject,
  pluginServerSession,
  pluginNodeDevice,
  pluginNodeUncaughtException,
  pluginNodeUnhandledRejection,
  pluginIntercept,
  pluginContextualize
]

const Bugsnag = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    const bugsnag = new Client(opts, schema, { name, version, url })

    bugsnag._delivery(delivery)

    plugins.forEach(pl => bugsnag.use(pl))

    bugsnag.__logger.debug('Loaded!')

    bugsnag.leaveBreadcrumb = function () {
      bugsnag.__logger.warn('Breadcrumbs are not supported in Node.js yet')
      return this
    }

    return bugsnag
  },
  init: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client.__logger.warn('init() called twice')
      return Bugsnag._client
    }
    Bugsnag._client = Bugsnag.createClient(opts)
    Bugsnag._client._depth += 1
  }
}

reduce(keys(Client.prototype), (accum, m) => {
  if (/^_/.test(m)) return accum
  accum[m] = function () {
    if (!Bugsnag._client) return console.error(`Bugsnag.${m}(…) was called before Bugsnag.init()`)
    return Bugsnag._client[m].apply(Bugsnag._client, arguments)
  }
  return accum
}, Bugsnag)

module.exports = Bugsnag

module.exports.Client = Client
module.exports.Event = Event
module.exports.Session = Session
module.exports.Breadcrumb = Breadcrumb

// Export a "default" property for compatibility with ESM imports
module.exports.default = Bugsnag
