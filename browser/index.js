const name = 'Bugsnag JavaScript'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('../base/client')
const Report = require('../base/report')
const Session = require('../base/session')
const Breadcrumb = require('../base/breadcrumb')
const { map, reduce } = require('../base/lib/es-utils')

// extend the base config schema with some browser-specific options
const schema = { ...require('../base/config').schema, ...require('./config') }

const pluginWindowOnerror = require('./plugins/window-onerror')
const pluginUnhandledRejection = require('./plugins/unhandled-rejection')
const pluginDevice = require('./plugins/device')
const pluginContext = require('./plugins/context')
const pluginRequest = require('./plugins/request')
const pluginThrottle = require('../base/plugins/throttle')
const pluginConsoleBreadcrumbs = require('./plugins/console-breadcrumbs')
const pluginNetworkBreadcrumbs = require('./plugins/network-breadcrumbs')
const pluginNavigationBreadcrumbs = require('./plugins/navigation-breadcrumbs')
const pluginInteractionBreadcrumbs = require('./plugins/interaction-breadcrumbs')
const pluginInlineScriptContent = require('./plugins/inline-script-content')
const pluginSessions = require('./plugins/sessions')
const pluginIp = require('./plugins/ip')
const pluginStripQueryString = require('./plugins/strip-query-string')

const plugins = [
  pluginWindowOnerror,
  pluginUnhandledRejection,
  pluginDevice,
  pluginContext,
  pluginRequest,
  pluginThrottle,
  pluginConsoleBreadcrumbs,
  pluginNetworkBreadcrumbs,
  pluginNavigationBreadcrumbs,
  pluginInteractionBreadcrumbs,
  pluginInlineScriptContent,
  pluginSessions,
  pluginIp,
  pluginStripQueryString
]

const transports = {
  'XDomainRequest': require('./transports/x-domain-request'),
  'XMLHttpRequest': require('./transports/xml-http-request')
}

module.exports = (opts, userPlugins = []) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // support renamed option
  if (opts.sessionTrackingEnabled) {
    opts.autoCaptureSessions = opts.sessionTrackingEnabled
  }

  // allow plugins to augment the schema with their own options
  const finalSchema = reduce([].concat(plugins).concat(userPlugins), (accum, plugin) => {
    if (!plugin.configSchema) return accum
    return { ...accum, ...plugin.configSchema }
  }, schema)

  const bugsnag = new Client({ name, version, url }, finalSchema)

  // set transport based on browser capability (IE 8+9 have an XDomainRequest object)
  bugsnag.transport(window.XDomainRequest ? transports.XDomainRequest : transports.XMLHttpRequest)

  try {
    // configure with user supplied options
    // errors can be thrown here that prevent the lib from being in a useable state
    bugsnag.configure(opts)
  } catch (e) {
    bugsnag._logger.warn(e)
    if (e.errors) map(e.errors, bugsnag._logger.warn)
    // rethrow. if there was an error with configuration
    // the library is not going to work
    throw e
  }

  // always-on browser-specific plugins
  bugsnag.use(pluginDevice)
  bugsnag.use(pluginContext)
  bugsnag.use(pluginRequest)
  bugsnag.use(pluginInlineScriptContent)
  bugsnag.use(pluginThrottle)
  bugsnag.use(pluginSessions)
  bugsnag.use(pluginIp)
  bugsnag.use(pluginStripQueryString)

  // optional browser-specific plugins

  if (bugsnag.config.autoNotify !== false) {
    bugsnag.use(pluginWindowOnerror)
    bugsnag.use(pluginUnhandledRejection)
  }

  if (inferBreadcrumbSetting(bugsnag.config, 'navigationBreadcrumbsEnabled')) {
    bugsnag.use(pluginNavigationBreadcrumbs)
  }

  if (inferBreadcrumbSetting(bugsnag.config, 'interactionBreadcrumbsEnabled')) {
    bugsnag.use(pluginInteractionBreadcrumbs)
  }

  if (inferBreadcrumbSetting(bugsnag.config, 'networkBreadcrumbsEnabled')) {
    bugsnag.use(pluginNetworkBreadcrumbs)
  }

  // because console breadcrumbs play havoc with line numbers,
  // if not explicitly enabled, only setup on non-development evironments
  if (inferBreadcrumbSetting(bugsnag.config, 'consoleBreadcrumbsEnabled', false)) {
    bugsnag.use(pluginConsoleBreadcrumbs)
  }

  // init user supplied plugins
  map(userPlugins, (plugin) => bugsnag.use(plugin))

  return bugsnag.config.autoCaptureSessions
    ? bugsnag.startSession()
    : bugsnag
}

const inferBreadcrumbSetting = (config, val, defaultInDev = true) =>
  typeof config[val] === 'boolean'
    ? config[val]
    : (config.autoBreadcrumbs &&
        (defaultInDev || !/^dev(elopment)?$/.test(config.releaseStage))
      )

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
