const { schema } = require('@bugsnag/core/config')
const { reduce } = require('@bugsnag/core/lib/es-utils')
const { stringWithLength } = require('@bugsnag/core/lib/validators')
const os = require('os')

module.exports = {
  hostname: {
    defaultValue: () => os.hostname(),
    message: 'should be a string',
    validate: value => value === null || stringWithLength(value)
  },
  logger: {
    ...schema.logger,
    defaultValue: () =>
      // set logger based on browser capability
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  }
}

const getPrefixedConsole = () => {
  const logger = {}
  return reduce([ 'debug', 'info', 'warn', 'error' ], (accum, method) => {
    const consoleMethod = console[method]
    logger[method] = consoleMethod.bind(console, '[bugsnag]')
    return accum
  }, {})
}
