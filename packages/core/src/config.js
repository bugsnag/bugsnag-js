const filter = require('./lib/es-utils/filter')
const reduce = require('./lib/es-utils/reduce')
const keys = require('./lib/es-utils/keys')
const isArray = require('./lib/es-utils/is-array')
const includes = require('./lib/es-utils/includes')
const intRange = require('./lib/validators/int-range')
const stringWithLength = require('./lib/validators/string-with-length')
const listOfFunctions = require('./lib/validators/list-of-functions')

const BREADCRUMB_TYPES = require('./lib/breadcrumb-types')
const defaultErrorTypes = () => ({ unhandledExceptions: true, unhandledRejections: true })

module.exports.schema = {
  apiKey: {
    defaultValue: () => null,
    message: 'is required',
    validate: stringWithLength
  },
  appVersion: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: value => value === undefined || stringWithLength(value)
  },
  appType: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: value => value === undefined || stringWithLength(value)
  },
  autoDetectErrors: {
    defaultValue: () => true,
    message: 'should be true|false',
    validate: value => value === true || value === false
  },
  enabledErrorTypes: {
    defaultValue: () => defaultErrorTypes(),
    message: 'should be an object containing the flags { unhandledExceptions:true|false, unhandledRejections:true|false }',
    allowPartialObject: true,
    validate: value => {
      // ensure we have an object
      if (typeof value !== 'object' || !value) return false
      const providedKeys = keys(value)
      const defaultKeys = keys(defaultErrorTypes())
      // ensure it only has a subset of the allowed keys
      if (filter(providedKeys, k => includes(defaultKeys, k)).length < providedKeys.length) return false
      // ensure all of the values are boolean
      if (filter(keys(value), k => typeof value[k] !== 'boolean').length > 0) return false
      return true
    }
  },
  onError: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: listOfFunctions
  },
  onSession: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: listOfFunctions
  },
  onBreadcrumb: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: listOfFunctions
  },
  endpoints: {
    defaultValue: (endpoints) => {
      // only apply the default value if no endpoints have been provided, otherwise prevent delivery by setting to null
      if (typeof endpoints === 'undefined') {
        return ({
          notify: 'https://notify.bugsnag.com',
          sessions: 'https://sessions.bugsnag.com'
        })
      } else {
        return ({ notify: null, sessions: null })
      }
    },
    message: 'should be an object containing endpoint URLs { notify, sessions }',
    validate: (val) =>
      // first, ensure it's an object
      (val && typeof val === 'object') &&
      (
        // notify and sessions must always be set
        stringWithLength(val.notify) && stringWithLength(val.sessions)
      ) &&
      // ensure no keys other than notify/session are set on endpoints object
      filter(keys(val), k => !includes(['notify', 'sessions'], k)).length === 0
  },
  autoTrackSessions: {
    defaultValue: val => true,
    message: 'should be true|false',
    validate: val => val === true || val === false
  },
  enabledReleaseStages: {
    defaultValue: () => null,
    message: 'should be an array of strings',
    validate: value => value === null || (isArray(value) && filter(value, f => typeof f === 'string').length === value.length)
  },
  releaseStage: {
    defaultValue: () => 'production',
    message: 'should be a string',
    validate: value => typeof value === 'string' && value.length
  },
  maxBreadcrumbs: {
    defaultValue: () => 25,
    message: 'should be a number ≤100',
    validate: value => intRange(0, 100)(value)
  },
  enabledBreadcrumbTypes: {
    defaultValue: () => BREADCRUMB_TYPES,
    message: `should be null or a list of available breadcrumb types (${BREADCRUMB_TYPES.join(',')})`,
    validate: value => value === null || (isArray(value) && reduce(value, (accum, maybeType) => {
      if (accum === false) return accum
      return includes(BREADCRUMB_TYPES, maybeType)
    }, true))
  },
  context: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: value => value === undefined || typeof value === 'string'
  },
  user: {
    defaultValue: () => ({}),
    message: 'should be an object with { id, email, name } properties',
    validate: value =>
      (value === null) ||
      (value && reduce(
        keys(value),
        (accum, key) => accum && includes(['id', 'email', 'name'], key),
        true
      ))
  },
  metadata: {
    defaultValue: () => ({}),
    message: 'should be an object',
    validate: (value) => typeof value === 'object' && value !== null
  },
  logger: {
    defaultValue: () => undefined,
    message: 'should be null or an object with methods { debug, info, warn, error }',
    validate: value =>
      (!value) ||
      (value && reduce(
        ['debug', 'info', 'warn', 'error'],
        (accum, method) => accum && typeof value[method] === 'function',
        true
      ))
  },
  redactedKeys: {
    defaultValue: () => ['password'],
    message: 'should be an array of strings|regexes',
    validate: value =>
      isArray(value) && value.length === filter(value, s =>
        (typeof s === 'string' || (s && typeof s.test === 'function'))
      ).length
  },
  plugins: {
    defaultValue: () => ([]),
    message: 'should be an array of plugin objects',
    validate: value =>
      isArray(value) && value.length === filter(value, p =>
        (p && typeof p === 'object' && typeof p.load === 'function')
      ).length
  },
  featureFlags: {
    defaultValue: () => [],
    message: 'should be an array of objects that have a "name" property',
    validate: value =>
      isArray(value) && value.length === filter(value, feature =>
        feature && typeof feature === 'object' && typeof feature.name === 'string'
      ).length
  },
  reportUnhandledPromiseRejectionsAsHandled: {
    defaultValue: () => false,
    message: 'should be true|false',
    validate: value => value === true || value === false
  },
  sendPayloadChecksums: {
    defaultValue: () => false,
    message: 'should be true|false',
    validate: value => value === true || value === false
  }
}
