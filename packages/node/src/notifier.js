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
const pluginConsoleBreadcrumbs = require('@bugsnag/plugin-console-breadcrumbs')

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
  pluginStackframePathNormaliser,
  pluginConsoleBreadcrumbs
]

const Bugsnag = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url })

    /**
     * Patch all calls to the client in order to forwards them to the context client if it exists
     *
     * This is useful for when client methods are called later, such as in the console breadcrumbs
     * plugin where we want to call `leaveBreadcrumb` on the request-scoped client, if it exists.
     */
    Object.keys(Client.prototype).forEach((m) => {
      if (/^_/.test(m)) return
      const original = bugsnag[m]
      bugsnag[m] = function () {
        // if we are in an async context, use the client from that context
        const contextClient = bugsnag._clientContext && bugsnag._clientContext.getStore() ? bugsnag._clientContext.getStore() : null
        const client = contextClient || bugsnag
        const originalMethod = contextClient ? contextClient[m] : original

        client._depth += 1
        const ret = originalMethod.apply(client, arguments)
        client._depth -= 1
        return ret
      }
    })

    // Used to store and retrieve the request-scoped client which makes it easy to obtain the request-scoped client
    // from anywhere in the codebase e.g. when calling Bugsnag.leaveBreadcrumb() or even within the global unhandled
    // promise rejection handler.
    bugsnag._clientContext = new AsyncLocalStorage()

    bugsnag._setDelivery(delivery)

    bugsnag._logger.debug('Loaded!')

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
    // if we are in an async context, use the client from that context
    let client = Bugsnag._client
    if (client && client._clientContext && client._clientContext.getStore()) {
      client = client._clientContext.getStore()
    }

    if (!client) return console.error(`Bugsnag.${m}() was called before Bugsnag.start()`)

    client._depth += 1
    const ret = client[m].apply(client, arguments)
    client._depth -= 1
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
