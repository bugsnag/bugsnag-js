const { schema } = require('@bugsnag/core/config')
const { map } = require('@bugsnag/core/lib/es-utils')
const { stringWithLength } = require('@bugsnag/core/lib/validators')

module.exports = {
  releaseStage: {
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      return 'production'
    },
    message: 'should be set',
    validate: stringWithLength
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
  const consoleLog = console.log
  map(['debug', 'info', 'warn', 'error'], (method) => {
    const consoleMethod = console[method]
    logger[method] = typeof consoleMethod === 'function'
      ? consoleMethod.bind(console, '[bugsnag]')
      : consoleLog.bind(console, '[bugsnag]')
  })
  return logger
}
