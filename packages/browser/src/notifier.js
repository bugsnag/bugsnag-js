const name = 'Bugsnag JavaScript'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

const { reduce, keys } = require('@bugsnag/core/lib/es-utils')

// extend the base config schema with some browser-specific options
const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const pluginWindowOnerror = require('@bugsnag/plugin-window-onerror')
const pluginUnhandledRejection = require('@bugsnag/plugin-window-unhandled-rejection')
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

    let warningMessage = ''

    if (opts.endpoints && opts.endpoints.notify && !opts.endpoints.sessions) {
      warningMessage += 'notify endpoint is set but sessions endpoint is not. No sessions will be sent.'
    }

    const bugsnag = new Client(opts, schema, { name, version, url })

    // set delivery based on browser capability (IE 8+9 have an XDomainRequest object)
    bugsnag._delivery(window.XDomainRequest ? dXDomainRequest : dXMLHttpRequest)

    if (warningMessage) bugsnag.__logger.warn(warningMessage)

    bugsnag.use(pluginStripQueryString)
    bugsnag.use(pluginInlineScriptContent)
    bugsnag.use(pluginDevice)
    bugsnag.use(pluginContext)
    bugsnag.use(pluginRequest)
    bugsnag.use(pluginThrottle)
    bugsnag.use(pluginSession)
    bugsnag.use(pluginIp)
    bugsnag.use(pluginWindowOnerror)
    bugsnag.use(pluginUnhandledRejection)
    bugsnag.use(pluginNavigationBreadcrumbs)
    bugsnag.use(pluginInteractionBreadcrumbs)
    bugsnag.use(pluginNetworkBreadcrumbs)
    bugsnag.use(pluginConsoleBreadcrumbs)

    bugsnag.__logger.debug('Loaded!')

    if (bugsnag._config.autoTrackSessions) bugsnag.startSession()

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
