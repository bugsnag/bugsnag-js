const { schema } = require('@bugsnag/core/config')
const stringWithLength = require('@bugsnag/core/lib/validators/string-with-length')

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
      minidumps: 'https://notify.bugsnag.com'
    }),
    message: 'should be an object containing endpoint URLs { notify, sessions, minidumps }',
    validate: val =>
      // first, ensure it's an object
      (val && typeof val === 'object') &&
      (
        // notify and sessions must always be set
        stringWithLength(val.notify) && stringWithLength(val.sessions)
      ) &&
      // ensure no keys other than notify/session/minidumps are set on endpoints object
      Object.keys(val).filter(k => !['notify', 'sessions', 'minidumps'].includes(k)).length === 0
  },
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  releaseStage: {
    ...schema.releaseStage
  }
}

const getPrefixedConsole = () => {
  return ['debug', 'info', 'warn', 'error'].reduce((accum, method) => {
    const consoleMethod = console[method] || console.log
    accum[method] = consoleMethod.bind(console, '[bugsnag][main]')
    return accum
  }, {})
}
