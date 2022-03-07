const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const React = require('react')
const Constants = require('expo-constants').default

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

Event.__type = 'expojs'

const delivery = require('@bugsnag/delivery-expo')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }
const BugsnagPluginReact = require('@bugsnag/plugin-react')

// The NetInfo module makes requests to this URL to detect if the device is connected
// to the internet. We don't want these requests to be recorded as breadcrumbs.
// see https://github.com/react-native-community/react-native-netinfo/blob/d39b18c61e220d518d8403b6f4f4ab5bcc8c973c/src/index.ts#L16
const NET_INFO_REACHABILITY_URL = 'https://clients3.google.com/generate_204'

const internalPlugins = [
  require('@bugsnag/plugin-react-native-global-error-handler')(),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-expo-device'),
  require('@bugsnag/plugin-expo-app'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs')([NET_INFO_REACHABILITY_URL, Constants.manifest?.logUrl || Constants.manifest2?.extra?.expoGo?.logUrl]),
  require('@bugsnag/plugin-react-native-app-state-breadcrumbs'),
  require('@bugsnag/plugin-react-native-connectivity-breadcrumbs'),
  require('@bugsnag/plugin-react-native-orientation-breadcrumbs'),
  require('@bugsnag/plugin-browser-session'),
  new BugsnagPluginReact(React)
]

const Bugsnag = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    // read the api key from app.json if one is not explicitly passed
    if (!opts.apiKey) {
      if (Constants.manifest?.extra?.bugsnag?.apiKey) {
        opts.apiKey = Constants.manifest.extra.bugsnag.apiKey
      } else if (Constants.manifest2?.extra?.expoClient?.extra?.bugsnag?.apiKey) {
        opts.apiKey = Constants.manifest2.extra.expoClient.extra.bugsnag.apiKey
      }
    }

    // read the version from app.json if one is not explicitly passed
    if (!opts.appVersion) {
      if (Constants.manifest?.version) {
        opts.appVersion = Constants.manifest.version
      } else if (Constants.manifest2?.extra?.expoClient?.version) {
        opts.appVersion = Constants.manifest2.extra.expoClient.version
      }
    }

    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url })

    bugsnag._setDelivery(delivery)

    bugsnag._logger.debug('Loaded!')

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
  }
}

// Object.keys(Client.prototype) does not work on native classes
// because the methods are non enumerable
Object.getOwnPropertyNames(Client.prototype).map((m) => {
  if (/^_/.test(m)) return
  Bugsnag[m] = function () {
    if (!Bugsnag._client) return console.warn(`Bugsnag.${m}() was called before Bugsnag.start()`)
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
