const { schema } = require('@bugsnag/core/config')
const map = require('@bugsnag/core/lib/es-utils/map')
const assign = require('@bugsnag/core/lib/es-utils/assign')

module.exports = {
  appType: {
    ...schema.appType,
    defaultValue: () => 'worker'
  },
  logger: assign({}, schema.logger, {
    defaultValue: () =>
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  })
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
