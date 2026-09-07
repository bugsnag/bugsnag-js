const name = 'Bugsnag JavaScript (lite)'
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

// only the plugins required for basic error capture are bundled by default.
// everything else (breadcrumbs, device/context metadata, sessions,
// client IP collection, etc.) can be added on demand via the `plugins`
// config option, keeping the default bundle as small as possible.
const pluginWindowOnerror = require('@bugsnag/plugin-window-onerror')
const pluginUnhandledRejection = require('@bugsnag/plugin-window-unhandled-rejection')

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
      pluginWindowOnerror(),
      pluginUnhandledRejection()
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
  isStarted: () => {
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
