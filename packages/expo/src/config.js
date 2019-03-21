/* global __DEV__ */

const { schema } = require('@bugsnag/core/config')
const { reduce } = require('@bugsnag/core/lib/es-utils')

module.exports = {
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => process.env.NODE_ENV || 'production'
  }
}

const getPrefixedConsole = () => {
  return reduce([ 'debug', 'info', 'warn', 'error' ], (accum, method) => {
    // console.error causes standalone expo apps to reload on android
    // so don't do any logging that level – use console.warn instead
    const consoleMethod = (__DEV__ && method === 'error') ? console.warn : console[method]
    accum[method] = consoleMethod.bind(console, '[bugsnag]')
    return accum
  }, {})
}
