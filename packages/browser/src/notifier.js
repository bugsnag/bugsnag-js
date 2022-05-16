const name = 'Bugsnag JavaScript'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

const map = require('@bugsnag/core/lib/es-utils/map')
const keys = require('@bugsnag/core/lib/es-utils/keys')
const assign = require('@bugsnag/core/lib/es-utils/assign')

// extend the base config schema with some browser-specific options
const schema = assign({}, require('@bugsnag/core/config').schema, require('./config'))

const pluginWindowOnerror = require('@bugsnag/plugin-window-onerror')
const pluginUnhandledRejection = require('@bugsnag/plugin-window-unhandled-rejection')
const pluginApp = require('@bugsnag/plugin-app-duration')
const pluginDevice = require('@bugsnag/plugin-browser-device')
const pluginContext = require('@bugsnag/plugin-browser-context')
const pluginRequest = require('@bugsnag/plugin-browser-request')
const pluginThrottle = require('@bugsnag/plugin-simple-throttle')
const pluginConsoleBreadcrumbs = require('@bugsnag/plugin-console-breadcrumbs')
const pluginNetworkBreadcrumbs = require('@bugsnag/plugin-network-breadcrumbs')
const pluginNavigationBreadcrumbs = require('@bugsnag/plugin-navigation-breadcrumbs')
const pluginInteractionBreadcrumbs = require('@bugsnag/plugin-interaction-breadcrumbs')
const pluginInlineScriptContent = require('@bugsnag/plugin-inline-script-content')
const pluginSession = require('@bugsnag/plugin-browser-session')
const pluginIp = require('@bugsnag/plugin-client-ip')
const pluginStripQueryString = require('@bugsnag/plugin-strip-query-string')

// delivery mechanisms
const dXDomainRequest = require('@bugsnag/delivery-x-domain-request')
const dXMLHttpRequest = require('@bugsnag/delivery-xml-http-request')

const Bugsnag = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    const internalPlugins = [
      // add browser-specific plugins
      pluginApp,
      pluginDevice(),
      pluginContext(),
      pluginRequest(),
      pluginThrottle,
      pluginSession,
      pluginIp,
      pluginStripQueryString,
      pluginWindowOnerror(),
      pluginUnhandledRejection(),
      pluginNavigationBreadcrumbs(),
      pluginInteractionBreadcrumbs(),
      pluginNetworkBreadcrumbs(),
      pluginConsoleBreadcrumbs,

      // this one added last to avoid wrapping functionality before bugsnag uses it
      pluginInlineScriptContent()
    ]

    // configure a client with user supplied options
    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url })

    // set delivery based on browser capability (IE 8+9 have an XDomainRequest object)
    bugsnag._setDelivery(window.XDomainRequest ? dXDomainRequest : dXMLHttpRequest)

    bugsnag._logger.debug('Loaded!')
    bugsnag.leaveBreadcrumb('Bugsnag loaded', {}, 'state')

    return bugsnag._config.autoTrackSessions
      ? bugsnag.startSession()
      : bugsnag
  },
  start: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
      return Bugsnag._client
    }
    Bugsnag._client = Bugsnag.createClient(opts)
    return Bugsnag._client
  },
  get isStarted () {
    return Bugsnag._client != null
  }
}

map(['resetEventCount'].concat(keys(Client.prototype)), (m) => {
  if (/^_/.test(m)) return
  Bugsnag[m] = function () {
    if (!Bugsnag._client) return console.log(`Bugsnag.${m}() was called before Bugsnag.start()`)
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
