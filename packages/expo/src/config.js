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
    const consoleMethod = console[method] || console.log
    accum[method] = consoleMethod.bind(console, '[bugsnag]')
    return accum
  }, {})
}
