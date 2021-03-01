const { schema } = require('@bugsnag/core/config')
const stringWithLength = require('@bugsnag/core/lib/validators/string-with-length')
const intRange = require('@bugsnag/core/lib/validators/int-range')
const listOfFunctions = require('@bugsnag/core/lib/validators/list-of-functions')
const process = require('process')
const { inspect } = require('util')
const { app } = require('electron')

const defaultErrorTypes = () => ({ unhandledExceptions: true, unhandledRejections: true, nativeCrashes: true })

module.exports.schema = {
  ...schema,
  enabledErrorTypes: {
    defaultValue: () => defaultErrorTypes(),
    message: 'should be an object containing the flags { unhandledExceptions:true|false, unhandledRejections:true|false, nativeCrashes: true|false }',
    allowPartialObject: true,
    validate: value => {
      // ensure we have an object
      if (typeof value !== 'object' || !value) return false
      const providedKeys = Object.keys(value)
      const defaultKeys = Object.keys(defaultErrorTypes())
      // ensure it only has a subset of the allowed keys
      if (providedKeys.filter(k => defaultKeys.includes(k)).length < providedKeys.length) return false
      // ensure all of the values are boolean
      if (Object.keys(value).filter(k => typeof value[k] !== 'boolean').length > 0) return false
      return true
    }
  },
  endpoints: {
    defaultValue: () => ({
      notify: 'https://notify.bugsnag.com',
      sessions: 'https://sessions.bugsnag.com',
      minidumps: 'https://notify.bugsnag.com/minidumps'
    }),
    message: 'should be an object containing endpoint URLs { notify, sessions, minidumps }',
    validate: val =>
      // first, ensure it's an object
      (val && typeof val === 'object') &&
      (
        // notify, sessions and minidumps must always be set
        stringWithLength(val.notify) && stringWithLength(val.sessions) && stringWithLength(val.minidumps)
      ) &&
      // ensure no keys other than notify/session are set on endpoints object
      Object.keys(val).filter(k => !['notify', 'sessions', 'minidumps'].includes(k)).length === 0
  },
  idleThreshold: {
    defaultValue: () => 60,
    message: 'should be an integer > 0',
    validate: value => intRange(0, Infinity)(value)
  },
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  onSend: {
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
    defaultValue: () => process.cwd(),
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
