const { schema } = require('@bugsnag/core/config')
const stringWithLength = require('@bugsnag/core/lib/validators/string-with-length')
const rnPackage = require('react-native/package.json')

const ALLOWED_IN_JS = ['onError', 'onBreadcrumb', 'logger', 'metadata', 'user', 'context', 'codeBundleId']
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
    accum[method] = console[method].bind(console, '[bugsnag]')
    return accum
  }, {})
}

const getEngine = () => global.hermes ? 'hermes' : 'jsc'
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

  // save the original values to check for mutations (user, context and metadata can be supplied in JS)
  Object.defineProperty(opts, '_originalValues', { value: { ...opts }, enumerable: false, writable: false })

  return new Proxy(opts, {
    set (obj, prop, value) {
      if (!ALLOWED_IN_JS.includes(prop)) {
        warn(`[bugsnag] Cannot set "${prop}" configuration option in JS. This must be set in the native layer.`)
        return true
      }
      return Reflect.set(...arguments)
    },
    deleteProperty (target, prop) {
      if (!ALLOWED_IN_JS.includes(prop)) {
        warn(`[bugsnag] Cannot delete "${prop}" configuration option in JS. This must be set in the native layer.`)
        return true
      }
      return Reflect.deleteProperty(...arguments)
    }
  })
}
