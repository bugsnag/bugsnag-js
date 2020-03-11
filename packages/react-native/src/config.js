const { schema } = require('@bugsnag/core/config')
const stringWithLength = require('@bugsnag/core/lib/validators/string-with-length')

const ALLOWED_IN_JS = ['onError', 'onBreadcrumb', 'logger', 'metadata', 'user', 'context']

module.exports.schema = {
  ...schema,
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  }
}

const getPrefixedConsole = () => {
  return ['debug', 'info', 'warn', 'error'].reduce((accum, method) => {
    accum[method] = console[method].bind(console, '[bugsnag]')
    return accum
  }, {})
}

module.exports.load = (NativeClient) => {
  const nativeOpts = NativeClient.configure()

  // if we don't have any native options, something went wrong
  if (!nativeOpts) throw new Error('[bugsnag] Configuration could not be loaded from native client')

  // annotate the config object with the fact it came from the native layer
  Object.defineProperty(nativeOpts, '_didLoadFromConfig', { value: true, enumerable: false })
  // save the original values to check for mutations (user, context and metadata can be supplied in JS)
  Object.defineProperty(nativeOpts, '_originalValues', { value: { ...nativeOpts }, enumerable: false, writable: false })

  return freeze(nativeOpts)
}

const freeze = opts => {
  return new Proxy(opts, {
    set (obj, prop, value) {
      if (!ALLOWED_IN_JS.includes(prop)) {
        console.warn(new Error(`[bugsnag] Cannot set "${prop}" configuration option in JS. This must be set in the native layer.`))
        return
      }
      return Reflect.set(...arguments)
    },
    deleteProperty (target, prop) {
      if (!ALLOWED_IN_JS.includes(prop)) {
        console.warn(new Error(`[bugsnag] Cannot delete "${prop}" configuration option in JS. This must be set in the native layer.`))
        return
      }
      return Reflect.deleteProperty(...arguments)
    }
  })
}
