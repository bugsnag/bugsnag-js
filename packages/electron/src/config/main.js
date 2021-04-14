const { schema } = require('./common')
const stringWithLength = require('@bugsnag/core/lib/validators/string-with-length')
const listOfFunctions = require('@bugsnag/core/lib/validators/list-of-functions')
const process = require('process')
const { inspect } = require('util')
const { app } = require('electron')

module.exports.schema = {
  ...schema,
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  onSendError: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: listOfFunctions
  },
  onUncaughtException: {
    defaultValue: () => (err, event, logger) => {
      logger.error(`Uncaught exception, the process will now terminate…\n${printError(err)}`)
      process.exit(1)
    },
    message: 'should be a function',
    validate: value => typeof value === 'function'
  },
  onUnhandledRejection: {
    defaultValue: () => (err, event, logger) => {
      logger.error(`Unhandled rejection…\n${printError(err)}`)
    },
    message: 'should be a function',
    validate: value => typeof value === 'function'
  },
  projectRoot: {
    defaultValue: () => app.getAppPath(),
    validate: value => value === null || stringWithLength(value),
    message: 'should be string'
  },
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => app.isPackaged ? 'production' : 'development'
  }
}

const printError = err => err && err.stack ? err.stack : inspect(err)

const getPrefixedConsole = () => {
  return ['debug', 'info', 'warn', 'error'].reduce((accum, method) => {
    const consoleMethod = console[method] || console.log
    accum[method] = consoleMethod.bind(console, '[bugsnag][main]')
    return accum
  }, {})
}
