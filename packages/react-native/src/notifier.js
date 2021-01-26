const NativeModules = require('react-native').NativeModules
const NativeClient = NativeModules.BugsnagReactNative

const REMOTE_DEBUGGING_WARNING = `Bugsnag cannot initialize synchronously when running in the remote debugger.

Error reporting is still supported, but synchronous calls after Bugsnag.start() will no-op. This means Bugsnag.leaveBreadcrumb(), Bugsnag.setUser() and all other methods will only begin to work after a short delay.
Plugins are also affected. Synchronous calls to Bugsnag.getPlugin() can be used as normal, but plugins may not report errors and set contextual data correctly in the debugger.

This only affects the remote debugger. Execution of JS in the normal way (on the device) is not affected.`

// this is how some internal react native code detects whether the app is running
// in the remote debugger:
//   https://github.com/facebook/react-native/blob/1f4535c17572df78e2a033890220337e5703b614/Libraries/ReactNative/PaperUIManager.js#L62-L66
// there's no public api for this so we use the same approach
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
  require('@bugsnag/plugin-react-native-hermes')(),
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

  // if we let JS keep error breadcrumbs, it results in an error containing itself as a breadcrumb
  bugsnag._config.enabledBreadcrumbTypes = bugsnag._config.enabledBreadcrumbTypes.filter(t => t !== 'error')

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

  if (bugsnag._config.autoTrackSessions) bugsnag.resumeSession()

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
      return Bugsnag._client
    }

    console.warn(REMOTE_DEBUGGING_WARNING)

    let initialised = false

    const stubSchema = { ...schema }
    // remove the api key from the schema so it doesn't get validated – we know we don't
    // have one at this point, and the only other alternative is to use a fake (but valid) one
    delete stubSchema.apiKey
    const stubClient = new Client({
      ...opts,
      autoTrackSessions: false,
      autoDetectErrors: false,
      enabledBreadcrumbTypes: []
    }, stubSchema, internalPlugins, { name, version, url })

    CLIENT_METHODS.forEach((m) => {
      if (/^_/.test(m)) return
      stubClient[m] = new Proxy(stubClient[m], {
        apply: (target, thisArg, args) => {
          if (!initialised) {
            console.log(`Synchronous call to Bugsnag.${m}()`)
          }
          return Reflect.apply(target, thisArg, args)
        }
      })
    })

    Bugsnag._client = stubClient

    createClientAsync(opts).then(client => {
      initialised = true
      Bugsnag._client = client
    })

    return stubClient
  }
}

CLIENT_METHODS.forEach((m) => {
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
