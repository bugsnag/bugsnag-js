const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const React = require('react')
const Constants = require('expo-constants').default

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

const { reduce } = require('@bugsnag/core/lib/es-utils')

const delivery = require('@bugsnag/delivery-expo')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-expo-device'),
  require('@bugsnag/plugin-expo-app'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs'),
  require('@bugsnag/plugin-react-native-app-state-breadcrumbs'),
  require('@bugsnag/plugin-react-native-connectivity-breadcrumbs'),
  require('@bugsnag/plugin-react-native-orientation-breadcrumbs'),
  require('@bugsnag/plugin-browser-session')
]

const bugsnagReact = require('@bugsnag/plugin-react')

// The NetInfo module makes requests to this URL to detect if the device is connected
// to the internet. We don't want these requests to be recorded as breadcrumbs.
// see https://github.com/react-native-community/react-native-netinfo/blob/d39b18c61e220d518d8403b6f4f4ab5bcc8c973c/src/index.ts#L16
const NET_INFO_REACHABILITY_URL = 'https://clients3.google.com/generate_204'

const Bugsnag = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    // attempt to fetch apiKey from app.json if we didn't get one explicitly passed
    if (!opts.apiKey &&
      Constants.manifest &&
      Constants.manifest.extra &&
      Constants.manifest.extra.bugsnag &&
      Constants.manifest.extra.bugsnag.apiKey) {
      opts.apiKey = Constants.manifest.extra.bugsnag.apiKey
    }

    if (!opts.appVersion && Constants.manifest && Constants.manifest.version) {
      opts.appVersion = Constants.manifest.version
    }

    const bugsnag = new Client(opts, schema, { name, version, url })

    bugsnag._setDelivery(delivery)

    plugins.forEach(pl => {
      switch (pl.name) {
        case 'networkBreadcrumbs':
          bugsnag.use(pl, () => [
            bugsnag._config.endpoints.notify,
            bugsnag._config.endpoints.sessions,
            Constants.manifest.logUrl,
            NET_INFO_REACHABILITY_URL
          ])
          break
        default:
          bugsnag.use(pl)
      }
    })
    bugsnag.use(bugsnagReact, React)

    bugsnag._logger.debug('Loaded!')

    return bugsnag._config.autoTrackSessions
      ? bugsnag.startSession()
      : bugsnag
  },
  init: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('init() called twice')
      return Bugsnag._client
    }
    Bugsnag._client = Bugsnag.createClient(opts)
    Bugsnag._client._depth += 1
  }
}

// Object.keys(Client.prototype) does not work on native classes
// because the methods are non enumerable
reduce(Object.getOwnPropertyNames(Client.prototype), (accum, m) => {
  if (/^_/.test(m)) return accum
  accum[m] = function () {
    if (!Bugsnag._client) return console.warn(`Bugsnag.${m}(…) was called before Bugsnag.init()`)
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
