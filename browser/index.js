const name = 'Bugsnag Browser JS Notifier'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/REPLACE_ME'

const Client = require('../base/client')
const { map } = require('../base/lib/es-utils')

// extend the base config schema with some browser-specific options
const schema = { ...require('../base/config').schema, ...require('./config') }

const plugins = {
  'window onerror': require('./plugins/window-onerror'),
  'unhandled rejection': require('./plugins/unhandled-rejection'),
  'device': require('./plugins/device'),
  'context': require('./plugins/context'),
  'throttle': require('../base/plugins/throttle'),
  'console breadcrumbs': require('./plugins/console-breadcrumbs'),
  'navigation breadcrumbs': require('./plugins/navigation-breadcrumbs'),
  'interaction breadcrumbs': require('./plugins/interaction-breadcrumbs')
}

const transports = {
  'XDomainRequest': require('./transports/x-domain-request'),
  'XMLHttpRequest': require('./transports/xml-http-request')
}

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  const bugsnag = new Client({ name, version, url }, schema)

  // set transport based on browser capability (IE 8+9 have an XDomainRequest object)
  bugsnag.transport(window.XDomainRequest ? transports.XDomainRequest : transports.XMLHttpRequest)
  // set logger based on browser capability
  if (typeof console !== 'undefined' && typeof console.debug !== 'undefined') bugsnag.logger(console)

  // try {
    // configure with user supplied options
    // errors can be thrown here that prevent the lib from being in a useable state
    bugsnag.configure(opts)
  // } catch (e) {
  //   bugsnag._logger.warn(e)
  //   if (e.errors) map(e.errors, bugsnag._logger.warn)
  //   return bugsnag
  // }

  // browser-specific plugins
  bugsnag.use(plugins['device'])
  bugsnag.use(plugins['context'])

  // optional browser-specific plugins
  if (bugsnag.config.autoNotify !== false) {
    bugsnag.use(plugins['window onerror'])
    bugsnag.use(plugins['unhandled rejection'])
    bugsnag.use(plugins['navigation breadcrumbs'])
    bugsnag.use(plugins['interaction breadcrumbs'])
  }

  // set up auto breadcrumbs if explicitely enabled, otherwise setup unless releaseStage is dev(elopment)
  if (bugsnag.config.autoConsoleBreadcumbsEnabled || !/^dev(elopment)?$/.test(bugsnag.config.releaseStage)) {
    bugsnag.use(plugins['console breadcrumbs'])
  }

  bugsnag.use(plugins['throttle'])

  return bugsnag
}
