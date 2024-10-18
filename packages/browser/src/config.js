const { schema } = require('@bugsnag/core/config')
const map = require('@bugsnag/core/lib/es-utils/map')
const assign = require('@bugsnag/core/lib/es-utils/assign')

module.exports = {
  releaseStage: assign({}, schema.releaseStage, {
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      return 'production'
    }
  }),
  appType: {
    ...schema.appType,
    defaultValue: () => 'browser'
  },
  logger: assign({}, schema.logger, {
    defaultValue: () =>
      // set logger based on browser capability
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  }),
  sendPayloadChecksums: assign({}, schema.sendPayloadChecksums, {
    defaultValue: () => false,
    validate: value => value === true || value === false
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
