/* global __DEV__ */

const { schema } = require('@bugsnag/core/config')
const { reduce } = require('@bugsnag/core/lib/es-utils')

// The app can still run in production "mode" in development environments, in which
// cases the global boolean __DEV__ will be set to true
const IS_PRODUCTION_MODE = typeof __DEV__ === 'undefined' || __DEV__ !== true

module.exports = {
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => {
      if (IS_PRODUCTION_MODE) return 'production'
      return 'development'
    }
  }
}

const getPrefixedConsole = () => {
  return reduce(['debug', 'info', 'warn', 'error'], (accum, method) => {
    accum[method] = console[method].bind(console, '[bugsnag]')
    return accum
  }, {})
}
