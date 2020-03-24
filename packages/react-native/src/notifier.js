const NativeModules = require('react-native').NativeModules
const NativeClient = NativeModules.BugsnagReactNative

const REMOTE_DEBUGGING_WARNING = `Bugsnag cannot initialise synchronously when running in the remote debugger.

Error reporting is still supported, but synchronous calls afted Bugsnag.start() will no-op. This means Bugsnag.leaveBreadcrumb(), Bugsnag.setUser() and all other methods will only begin to work after a short delay.

This only affects the remote debugger. Execution of JS in the normal way (on the device) is not affected.`

const isDebuggingRemotely = !global.nativeCallSyncHook

const name = 'Bugsnag React Native'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const React = require('react')

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Session = require('@bugsnag/core/session')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

const delivery = require('@bugsnag/delivery-react-native')

const BugsnagPluginReact = require('@bugsnag/plugin-react')

const { schema, load, loadAsync } = require('./config')

const internalPlugins = [
  require('@bugsnag/plugin-react-native-session')(NativeClient),
  require('@bugsnag/plugin-react-native-event-sync')(NativeClient),
  require('@bugsnag/plugin-react-native-client-sync')(NativeClient),
  require('@bugsnag/plugin-react-native-global-error-handler')(),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs')(),
  new BugsnagPluginReact(React)
]

const CLIENT_METHODS = Object.getOwnPropertyNames(Client.prototype)

const createClientAsync = async (jsOpts) => {
  const opts = await loadAsync(NativeClient, version)
  return _createClient(opts, jsOpts)
}

const createClient = (jsOpts) => {
  const opts = load(NativeClient, version)
  return _createClient(opts, jsOpts)
}

const _createClient = (opts, jsOpts) => {
  if (jsOpts && typeof jsOpts === 'object') {
    // mutate the options with anything supplied in JS. This will throw
    Object.keys(jsOpts).forEach(k => { opts[k] = jsOpts[k] })
  }

  const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url })

  bugsnag._setDelivery(client => delivery(client, NativeClient))

  if (opts.user && opts.user !== opts._originalValues.user) {
    bugsnag.setUser(opts.user.id, opts.user.email, opts.user.name)
  }

  if (opts.context && opts.context !== opts._originalValues.context) {
    bugsnag.setContext(opts.context)
  }

  if (opts.metadata && opts.metadata !== opts._originalValues.metadata) {
    Object.keys(opts.metadata).forEach(k => bugsnag.addMetadata(k, opts.metadata[k]))
  }

  if (opts.codeBundleId) {
    NativeClient.updateCodeBundleId(opts.codeBundleId)
  }

  bugsnag._logger.debug('Loaded!')

  return bugsnag
}

const Bugsnag = {
  _client: null,
  start: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
      return Bugsnag._client
    }
    if (!isDebuggingRemotely) {
      Bugsnag._client = createClient(opts)
      Bugsnag._client._depth += 1
      return Bugsnag._client
    } else {
      console.warn(REMOTE_DEBUGGING_WARNING)
      let initialised = false
      const stubClient = {}
      CLIENT_METHODS.reduce((accum, m) => {
        stubClient[m] = new Proxy(() => {
          console.warn(`Bugsnag.${m}() will no-op because Bugsnag has not yet initialised`)
        }, {
          apply: (target, thisArg, argumentsList) => {
            if (!initialised) return Reflect.apply(target, thisArg, argumentsList)
            return Reflect.apply(Bugsnag._client[m], Bugsnag._client, argumentsList)
          }
        })
      })
      Bugsnag._client = stubClient
      createClientAsync(opts).then(client => {
        initialised = true
        Bugsnag._client = client
        Bugsnag._client._depth += 1
      })
      return stubClient
    }
  }
}

CLIENT_METHODS.map((m) => {
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
