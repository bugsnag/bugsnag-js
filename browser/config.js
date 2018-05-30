const { schema } = require('../base/config')
const { map } = require('../base/lib/es-utils')
const { stringWithLength } = require('../base/lib/validators')

module.exports = {
  releaseStage: {
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      return 'production'
    },
    message: 'should be set',
    validate: stringWithLength
  },
  collectUserIp: {
    defaultValue: () => true,
    message: 'should be true|false',
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
