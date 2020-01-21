const { schema } = require('@bugsnag/core/config')
const { reduce } = require('@bugsnag/core/lib/es-utils')
const { stringWithLength } = require('@bugsnag/core/lib/validators')
const os = require('os')
const process = require('process')
const { inspect } = require('util')

module.exports = {
  projectRoot: {
    defaultValue: () => process.cwd(),
    validate: value => value === null || stringWithLength(value),
    message: 'should be string'
  },
  hostname: {
    defaultValue: () => os.hostname(),
    message: 'should be a string',
    validate: value => value === null || stringWithLength(value)
  },
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => process.env.NODE_ENV || 'production'
  },
  agent: {
    defaultValue: () => undefined,
    message: 'should be an HTTP(s) agent',
    validate: value => value === undefined || isAgent(value)
  },
  onUncaughtException: {
    defaultValue: () => (err, report, logger) => {
      logger.error(`Uncaught exception${getContext(report)}, the process will now terminate…\n${printError(err)}`)
      process.exit(1)
    },
    message: 'should be a function',
    validate: value => typeof value === 'function'
  },
  onUnhandledRejection: {
    defaultValue: () => (err, report, logger) => {
      logger.error(`Unhandled rejection${getContext(report)}…\n${printError(err)}`)
    },
    message: 'should be a function',
    validate: value => typeof value === 'function'
  }
}

const printError = err => err && err.stack ? err.stack : inspect(err)

const getPrefixedConsole = () => {
  return reduce([ 'debug', 'info', 'warn', 'error' ], (accum, method) => {
    const consoleMethod = console[method] || console.log
    accum[method] = consoleMethod.bind(console, '[bugsnag]')
    return accum
  }, {})
}

const getContext = report =>
  report.request && Object.keys(report.request).length
    ? ` at ${report.request.httpMethod} ${report.request.path || report.request.url}`
    : ``

const isAgent = value => (typeof value === 'object' && value !== null) || typeof value === 'boolean'
