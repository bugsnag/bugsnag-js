const name = 'Bugsnag Node'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const { AsyncLocalStorage } = require('async_hooks')

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

Event.__type = 'nodejs'

const delivery = require('@bugsnag/delivery-node')

// extend the base config schema with some node-specific options
const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

// remove enabledBreadcrumbTypes from the config schema
delete schema.enabledBreadcrumbTypes

const pluginApp = require('@bugsnag/plugin-app-duration')
const pluginSurroundingCode = require('@bugsnag/plugin-node-surrounding-code')
const pluginInProject = require('@bugsnag/plugin-node-in-project')
const pluginStripProjectRoot = require('@bugsnag/plugin-strip-project-root')
const pluginServerSession = require('@bugsnag/plugin-server-session')
const pluginNodeDevice = require('@bugsnag/plugin-node-device')
const pluginNodeUncaughtException = require('@bugsnag/plugin-node-uncaught-exception')
const pluginNodeUnhandledRejection = require('@bugsnag/plugin-node-unhandled-rejection')
const pluginIntercept = require('@bugsnag/plugin-intercept')
const pluginContextualize = require('@bugsnag/plugin-contextualize')
const pluginStackframePathNormaliser = require('@bugsnag/plugin-stackframe-path-normaliser')

const internalPlugins = [
  pluginApp,
  pluginSurroundingCode,
  pluginInProject,
  pluginStripProjectRoot,
  pluginServerSession,
  pluginNodeDevice,
  pluginNodeUncaughtException,
  pluginNodeUnhandledRejection,
  pluginIntercept,
  pluginContextualize,
  pluginStackframePathNormaliser
]

// Used to store and retrieve the request-scoped client which makes it easy to obtain the request-scoped client
// from anywhere in the codebase e.g. when calling Bugsnag.leaveBreadcrumb() or even within the global unhandled
// promise rejection handler.
const clientContext = new AsyncLocalStorage()

const Bugsnag = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url })

    bugsnag._clientContext = clientContext

    bugsnag._setDelivery(delivery)

    bugsnag._logger.debug('Loaded!')

    bugsnag.leaveBreadcrumb = function () {
      bugsnag._logger.warn('Breadcrumbs are not supported in Node.js yet')
    }

    bugsnag._config.enabledBreadcrumbTypes = []

    return bugsnag
  },
  start: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
      return Bugsnag._client
    }
    Bugsnag._client = Bugsnag.createClient(opts)
    return Bugsnag._client
  },
  isStarted: () => {
    return Bugsnag._client != null
  }
}

Object.keys(Client.prototype).forEach((m) => {
  if (/^_/.test(m)) return
  Bugsnag[m] = function () {
    if (!Bugsnag._client) return console.error(`Bugsnag.${m}() was called before Bugsnag.start()`)
    Bugsnag._client._depth += 1
    const ret = Bugsnag._client[m].apply(Bugsnag._client, arguments)
    Bugsnag._client._depth -= 1
    return ret
  }
})

module.exports = Bugsnag

module.exports.Client = Client
module.exports.Event = Event
module.exports.Session = Session
module.exports.Breadcrumb = Breadcrumb

// Export a "default" property for compatibility with ESM imports
module.exports.default = Bugsnag
