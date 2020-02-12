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

const { schema, load } = require('./config')

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs')
]

const bugsnagReact = require('@bugsnag/plugin-react')

const Configuration = { load: () => load(NativeClient) }
const Bugsnag = {
  _client: null,
  createClient: (jsOpts) => {
    let opts
    if (jsOpts && jsOpts._didLoadFromConfig) {
      // values were already sourced from Configuration.load()
      opts = jsOpts
    } else {
      // load the native configuration
      opts = Configuration.load()
      // mutate the options with anything supplied in JS. This will throw
      Object.keys(jsOpts).forEach(k => { opts[k] = jsOpts[k] })
    }

    const bugsnag = new Client(opts, schema, { name, version, url })

    bugsnag._setDelivery(client => delivery(client, NativeClient))

    bugsnag.use(session, NativeClient)
    bugsnag.use(eventSync, NativeClient)
    bugsnag.use(clientSync, NativeClient)

    if (opts.user && opts.user !== opts._originalValues.user) {
      bugsnag.setUser(opts.user.id, opts.user.email, opts.user.name)
    }

    if (opts.context && opts.context !== opts._originalValues.context) {
      bugsnag.setContext(opts.context)
    }

    if (opts.metadata && opts.metadata !== opts._originalValues.metadata) {
      Object.keys(opts.metadata).forEach(k => bugsnag.addMetadata(k, opts.metadata[k]))
    }

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
module.exports.Configuration = Configuration

// Export a "default" property for compatibility with ESM imports
module.exports.default = Bugsnag
