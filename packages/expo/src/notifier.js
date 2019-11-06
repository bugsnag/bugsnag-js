const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const { reduce } = require('@bugsnag/core/lib/es-utils')

const React = require('react')
const Constants = require('expo-constants').default

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

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

const Configuration = {
  load: () => {
    if (Constants.manifest && Constants.manifest.extra) {
      return { ...Constants.manifest.extra.bugsnag }
    }
  }
}

const Bugsnag = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = Configuration.load()

    const bugsnag = new Client(opts, schema, { name, version, url })

    bugsnag._delivery(delivery)

    plugins.forEach(pl => {
      switch (pl.name) {
        case 'networkBreadcrumbs':
          bugsnag.use(pl, () => [
            bugsnag._config.endpoints.notify,
            bugsnag._config.endpoints.sessions,
            Constants.manifest.logUrl
          ])
          break
        default:
          bugsnag.use(pl)
      }
    })
    bugsnag.use(bugsnagReact, React)

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

reduce(Object.getOwnPropertyNames(Client.prototype), (accum, m) => {
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

module.exports.Configuration = Configuration

// Export a "default" property for compatibility with ESM imports
module.exports.default = Bugsnag
