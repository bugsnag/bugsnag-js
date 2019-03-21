const name = 'Bugsnag JavaScript'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('@bugsnag/core/client')
const Report = require('@bugsnag/core/report')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')
const { map } = require('@bugsnag/core/lib/es-utils')

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

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // support renamed/deprecated options

  const warnings = []

  if (opts.sessionTrackingEnabled) {
    warnings.push('deprecated option sessionTrackingEnabled is now called autoCaptureSessions')
    opts.autoCaptureSessions = opts.sessionTrackingEnabled
  }

  if ((opts.endpoint || opts.sessionEndpoint) && !opts.endpoints) {
    warnings.push('deprecated options endpoint/sessionEndpoint are now configured in the endpoints object')
    opts.endpoints = { notify: opts.endpoint, sessions: opts.sessionEndpoint }
  }

  if (opts.endpoints && opts.endpoints.notify && !opts.endpoints.sessions) {
    warnings.push('notify endpoint is set but sessions endpoint is not. No sessions will be sent.')
  }

  const bugsnag = new Client({ name, version, url })

  bugsnag.setOptions(opts)

  // set delivery based on browser capability (IE 8+9 have an XDomainRequest object)
  bugsnag.delivery(window.XDomainRequest ? dXDomainRequest : dXMLHttpRequest)

  // configure with user supplied options
  // errors can be thrown here that prevent the lib from being in a useable state
  bugsnag.configure(schema)

  map(warnings, w => bugsnag._logger.warn(w))

  // always-on browser-specific plugins
  bugsnag.use(pluginDevice)
  bugsnag.use(pluginContext)
  bugsnag.use(pluginRequest)
  bugsnag.use(pluginInlineScriptContent)
  bugsnag.use(pluginThrottle)
  bugsnag.use(pluginSession)
  bugsnag.use(pluginIp)
  bugsnag.use(pluginStripQueryString)

  // optional browser-specific plugins

  if (bugsnag.config.autoNotify !== false) {
    bugsnag.use(pluginWindowOnerror)
    bugsnag.use(pluginUnhandledRejection)
  }

  bugsnag.use(pluginNavigationBreadcrumbs)
  bugsnag.use(pluginInteractionBreadcrumbs)
  bugsnag.use(pluginNetworkBreadcrumbs)
  bugsnag.use(pluginConsoleBreadcrumbs)

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag.config.autoCaptureSessions
    ? bugsnag.startSession()
    : bugsnag
}

// Stub this value because this is what the type interface looks like
// (types/bugsnag.d.ts). This is only an issue in Angular's development
// mode as its TS/DI thingy attempts to use this value at runtime.
// In most other situations, TS only uses the types at compile time.
module.exports.Bugsnag = {
  Client,
  Report,
  Session,
  Breadcrumb
}

// Export a "default" property for compatibility with ESM imports
module.exports['default'] = module.exports
