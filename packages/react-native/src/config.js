const { schema } = require('@bugsnag/core/config')
const stringWithLength = require('@bugsnag/core/lib/validators/string-with-length')
const rnPackage = require('react-native/package.json')
const iserror = require('iserror')

const ALLOWED_IN_JS = ['onError', 'onBreadcrumb', 'logger', 'metadata', 'user', 'context', 'codeBundleId', 'plugins']
const allowedErrorTypes = () => ({
  unhandledExceptions: true,
  unhandledRejections: true,
  anrs: true,
  ndkCrashes: true,
  ooms: true
})

module.exports.schema = {
  ...schema,
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  codeBundleId: {
    defaultValue: () => null,
    message: 'should be a string',
    validate: val => (val === null || stringWithLength(val))
  },
  enabledErrorTypes: {
    ...schema.enabledErrorTypes,
    defaultValue: () => allowedErrorTypes(),
    validate: value => {
      // ensure we have an object
      if (typeof value !== 'object' || !value) return false
      const providedKeys = Object.keys(value)
      const allowedKeys = Object.keys(allowedErrorTypes())
      // ensure it only has a subset of the allowed keys
      if (providedKeys.filter(k => allowedKeys.includes(k)).length < providedKeys.length) return false
      // ensure all of the values are boolean
      if (Object.keys(value).filter(k => typeof value[k] !== 'boolean').length > 0) return false
      return true
    }
  }
}

const getPrefixedConsole = () => {
  return ['debug', 'info', 'warn', 'error'].reduce((accum, method) => {
    // keep references to initial console methods, since the
    // console breadcrumb plugin wraps them later
    const { debug, info, warn, error } = console
    const originalConsole = { debug, info, warn, error }
    if (method !== 'warn') {
      accum[method] = (...args) => originalConsole[method]('[bugsnag]', ...args)
    } else {
      accum[method] = (...args) => {
        if (!iserror(args[0])) {
          originalConsole[method]('[bugsnag]', ...args)
        } else {
          // a raw error doesn't display nicely in react native's yellow box,
          // so this takes the message from the error an displays that instead
          originalConsole[method]('[bugsnag]', `${args[0].message}`)
        }
      }
    }
    return accum
  }, {})
}

const getEngine = () => global.HermesInternal ? 'hermes' : 'jsc'
const getReactNativeVersion = () => rnPackage.version

module.exports.load = (
  NativeClient,
  notifierVersion,
  engine = getEngine(),
  reactNativeVersion = getReactNativeVersion(),
  warn = console.warn
) => {
  const nativeOpts = NativeClient.configure({ notifierVersion, engine, reactNativeVersion })
  return freeze(nativeOpts, warn)
}

module.exports.loadAsync = async (
  NativeClient,
  notifierVersion,
  engine = getEngine(),
  reactNativeVersion = getReactNativeVersion(),
  warn = console.warn
) => {
  const nativeOpts = await NativeClient.configureAsync({ notifierVersion, engine, reactNativeVersion })
  return freeze(nativeOpts, warn)
}

const freeze = (opts, warn) => {
  // if we don't have any native options, something went wrong
  if (!opts) throw new Error('[bugsnag] Configuration could not be loaded from native client')

  const frozenOpts = {}
  Object.keys(schema).forEach(k => {
    let val = opts[k]
    Object.defineProperty(frozenOpts, k, {
      enumerable: true,
      configurable: false,
      set (newValue) {
        if (!ALLOWED_IN_JS.includes(k)) {
          warn(`[bugsnag] Cannot set "${k}" configuration option in JS. This must be set in the native layer.`)
          return
        }
        val = newValue
      },
      get () { return val }
    })
  })

  // save the original values to check for mutations (user, context and metadata can be supplied in JS)
  Object.defineProperty(frozenOpts, '_originalValues', { value: { ...opts }, enumerable: false, writable: false })

  return frozenOpts
}
