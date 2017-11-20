const name = 'Bugsnag JavaScript'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('../base/client')
const { map, reduce } = require('../base/lib/es-utils')

// extend the base config schema with some browser-specific options
const schema = { ...require('../base/config').schema, ...require('./config') }

const plugins = {
  'window onerror': require('./plugins/window-onerror'),
  'unhandled rejection': require('./plugins/unhandled-rejection'),
  'device': require('./plugins/device'),
  'context': require('./plugins/context'),
  'request': require('./plugins/request'),
  'throttle': require('../base/plugins/throttle'),
  'console breadcrumbs': require('./plugins/console-breadcrumbs'),
  'navigation breadcrumbs': require('./plugins/navigation-breadcrumbs'),
  'interaction breadcrumbs': require('./plugins/interaction-breadcrumbs'),
  'inline script content': require('./plugins/inline-script-content')
}

const transports = {
  'XDomainRequest': require('./transports/x-domain-request'),
  'XMLHttpRequest': require('./transports/xml-http-request')
}

module.exports = (opts, userPlugins = []) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // allow plugins to augment the schema with their own options
  const finalSchema = reduce([].concat(plugins).concat(userPlugins), (accum, plugin) => {
    if (!plugin.configSchema) return accum
    return { ...accum, ...plugin.configSchema }
  }, schema)

  const bugsnag = new Client({ name, version, url }, finalSchema)

  // set transport based on browser capability (IE 8+9 have an XDomainRequest object)
  bugsnag.transport(window.XDomainRequest ? transports.XDomainRequest : transports.XMLHttpRequest)

  // set logger based on browser capability
  if (typeof console !== 'undefined' && typeof console.debug === 'function') {
    const logger = getPrefixedConsole()
    bugsnag.logger(logger)
  }

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
  bugsnag.use(plugins['device'])
  bugsnag.use(plugins['context'])
  bugsnag.use(plugins['request'])
  bugsnag.use(plugins['inline script content'])
  bugsnag.use(plugins['throttle'])

  // optional browser-specific plugins

  if (bugsnag.config.autoNotify !== false) {
    bugsnag.use(plugins['window onerror'])
    bugsnag.use(plugins['unhandled rejection'])
  }

  if (bugsnag.config.navigationBreadcumbsEnabled === true || bugsnag.config.autoBreadcrumbs) {
    bugsnag.use(plugins['navigation breadcrumbs'])
  }

  if (bugsnag.config.interactionBreadcumbsEnabled === true || bugsnag.config.autoBreadcrumbs) {
    bugsnag.use(plugins['interaction breadcrumbs'])
  }

  // because console breadcrumbs play havoc with line numbers,
  // if not explicitly enabled only setup on non-development evironments
  if (bugsnag.config.consoleBreadcumbsEnabled === true || (bugsnag.config.autoBreadcrumbs && !/^dev(elopment)?$/.test(bugsnag.config.releaseStage))) {
    bugsnag.use(plugins['console breadcrumbs'])
  }

  // init user supplied plugins
  map(userPlugins, (plugin) => bugsnag.use(plugin))

  return bugsnag
}

const getPrefixedConsole = () => {
  const logger = {}
  map([ 'debug', 'info', 'warn', 'error' ], (method) => {
    logger[method] = typeof console[method] === 'function'
      ? console[method].bind(console, '[bugsnag]')
      : console.log.bind(console, '[bugsnag]')
  })
  return logger
}

module.exports['default'] = module.exports

// auto start mode! If the currently executing script tag has data-autostart and
// data-apikey attributes, start and export a client object with the provided key
const currentScript = document.currentScript || (() => {
  const scripts = document.getElementsByTagName('script')
  return scripts[scripts.length - 1]
})()

if (currentScript.hasAttribute('data-autostart')) {
  const apiKey = currentScript.getAttribute('data-apikey')
  if (!apiKey) throw new Error('Bugsnag was configured with `autostart` but an API key was not provided. Use the `data-apikey="API_KEY"` attribute.')
  window.bugsnagClient = module.exports(apiKey)
}
