const name = 'Bugsnag Browser JS Notifier'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/REPLACE_ME'

const Client = require('../base/client')
const Breadcrumb = require('../base/breadcrumb')

// extend the base config schema with some browser-specific options
const schema = Object.assign({}, require('../base/config').schema, require('./config'))

const plugins = {
  'window onerror': require('./plugins/window-onerror'),
  'unhandled rejection': require('./plugins/unhandled-rejection'),
  'device': require('./plugins/device'),
  'context': require('./plugins/context'),
  'throttle': require('../base/plugins/throttle'),
  'console breadcrumbs': require('./plugins/console-breadcrumbs')
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
  bugsnag.logger(console)

  try {
    // configure with user supplied options
    // errors can be thrown here that prevent the lib from being in a useable state
    bugsnag.configure(opts)
  } catch (e) {
    bugsnag._logger.warn(e)
    if (e.errors) {
      e.errors.map(bugsnag._logger.warn)
    }
    return bugsnag
  }

  // browser-specific plugins
  bugsnag.use(plugins['device'])
  bugsnag.use(plugins['context'])

  // optional browser-specific plugins
  if (bugsnag.config.autoNotify !== false) {
    bugsnag.use(plugins['window onerror'])
    bugsnag.use(plugins['unhandled rejection'])
  }

  // set up auto breadcrumbs if explicitely enabled, otherwise setup unless releaseStage is dev(elopment)
  if (bugsnag.config.autoConsoleBreadcumbsEnabled || !/^dev(elopment)?$/.test(bugsnag.config.releaseStage)) {
    bugsnag.use(plugins['console breadcrumbs'])
  }

  bugsnag.use(plugins['throttle'])

  bugsnag.leaveBreadcrumb(new Breadcrumb('navigation', 'Bugsnag loaded'))

  return bugsnag
}
