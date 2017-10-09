const name = 'Bugsnag Browser JS Notifier'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/REPLACE_ME'

const Client = require('../base/client')

// extend the base config schema with some browser-specific options
const schema = Object.assign({}, require('../base/config').schema, {
  projectRoot: {
    defaultValue: () => `${window.location.protocol}//${window.location.host}`,
    message: '(String) projectRoot must be set',
    validate: value => typeof value === 'string' && value.length
  }
})

const plugins = {
  'window onerror': require('./plugins/window-onerror'),
  'unhandled rejection': require('./plugins/unhandled-rejection'),
  'device': require('./plugins/device'),
  'context': require('./plugins/context')
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

  return bugsnag
}
