const { schema } = require('../base/config')
const { map } = require('../base/lib/es-utils')
const getScope = require('./scope')

module.exports = {
  releaseStage: {
    defaultValue: () => {
      const scope = getScope()
      if (/^localhost(:\d+)?$/.test(scope.location.host)) return 'development'
      return 'production'
    },
    message: '(string) releaseStage should be set',
    validate: value => typeof value === 'string' && value.length
  },
  collectUserIp: {
    defaultValue: () => true,
    message: '(boolean) collectUserIp should true/false',
    validate: value => value === true || value === false
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
  const consoleLog = console['log']
  map([ 'debug', 'info', 'warn', 'error' ], (method) => {
    const consoleMethod = console[method]
    logger[method] = typeof consoleMethod === 'function'
      ? consoleMethod.bind(console, '[bugsnag]')
      : consoleLog.bind(console, '[bugsnag]')
  })
  return logger
}
