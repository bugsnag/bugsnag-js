const NativeModules = require('react-native').NativeModules
const NativeClient = NativeModules.BugsnagReactNative

const name = 'Bugsnag React Native'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const React = require('react')

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

const delivery = require('@bugsnag/delivery-react-native')
const session = require('@bugsnag/plugin-react-native-session')
const eventSync = require('@bugsnag/plugin-react-native-event-sync')
const clientSync = require('@bugsnag/plugin-react-native-client-sync')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs')
]

const bugsnagReact = require('@bugsnag/plugin-react')

const Bugsnag = {
  _client: null,
  createClient: (jsOpts) => {
    const opts = { ...NativeClient.configure(), ...jsOpts }

    const bugsnag = new Client(opts, schema, { name, version, url })

    bugsnag._setDelivery(client => delivery(client, NativeClient))

    bugsnag.use(session, NativeClient)
    bugsnag.use(eventSync, NativeClient)
    bugsnag.use(clientSync, NativeClient)

    plugins.forEach(pl => bugsnag.use(pl))
    bugsnag.use(bugsnagReact, React)

    bugsnag._logger.debug('Loaded!')

    return bugsnag
  },
  start: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
      return Bugsnag._client
    }
    Bugsnag._client = Bugsnag.createClient(opts)
    Bugsnag._client._depth += 1
    return Bugsnag._client
  }
}

// Object.keys(Client.prototype) does not work on native classes
// because the methods are non enumerable
Object.getOwnPropertyNames(Client.prototype).map((m) => {
  if (/^_/.test(m)) return
  Bugsnag[m] = function () {
    if (!Bugsnag._client) return console.warn(`Bugsnag.${m}() was called before Bugsnag.start()`)
    return Bugsnag._client[m].apply(Bugsnag._client, arguments)
  }
})

module.exports = Bugsnag

module.exports.Client = Client
module.exports.Event = Event
module.exports.Session = Session
module.exports.Breadcrumb = Breadcrumb

// Export a "default" property for compatibility with ESM imports
module.exports.default = Bugsnag
