const { filter, reduce, keys, isArray, includes } = require('./lib/es-utils')
const { intRange, stringWithLength, listOfFunctions } = require('./lib/validators')

const BREADCRUMB_TYPES = ['navigation', 'request', 'process', 'log', 'user', 'state', 'error', 'manual']

module.exports.schema = {
  apiKey: {
    defaultValue: () => null,
    message: 'is required',
    validate: stringWithLength
  },
  appVersion: {
    defaultValue: () => null,
    message: 'should be a string',
    validate: value => value === null || stringWithLength(value)
  },
  appType: {
    defaultValue: () => null,
    message: 'should be a string',
    validate: value => value === null || stringWithLength(value)
  },
  autoDetectErrors: {
    defaultValue: () => true,
    message: 'should be true|false',
    validate: value => value === true || value === false
  },
  autoDetectUnhandledRejections: {
    defaultValue: () => true,
    message: 'should be true|false',
    validate: value => value === true || value === false
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
    defaultValue: () => ({
      notify: 'https://notify.bugsnag.com',
      sessions: 'https://sessions.bugsnag.com'
    }),
    message: 'should be an object containing endpoint URLs { notify, sessions }',
    validate: val =>
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
    defaultValue: () => [],
    message: 'should be an array of strings',
    validate: value => isArray(value) && filter(value, f => typeof f === 'string').length === value.length
  },
  releaseStage: {
    defaultValue: () => 'production',
    message: 'should be a string',
    validate: value => typeof value === 'string' && value.length
  },
  maxBreadcrumbs: {
    defaultValue: () => 20,
    message: 'should be a number ≤40',
    validate: value => intRange(0, 40)(value)
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
    defaultValue: () => null,
    message: 'should be an object',
    validate: (value) => typeof value === 'object'
  },
  metadata: {
    defaultValue: () => null,
    message: 'should be an object',
    validate: (value) => typeof value === 'object'
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
  filters: {
    defaultValue: () => ['password'],
    message: 'should be an array of strings|regexes',
    validate: value =>
      isArray(value) && value.length === filter(value, s =>
        (typeof s === 'string' || (s && typeof s.test === 'function'))
      ).length
  }
}

module.exports.mergeDefaults = (opts, schema) => {
  if (!opts || !schema) throw new Error('opts and schema objects are required')
  return reduce(keys(schema), (accum, key) => {
    accum[key] = opts[key] !== undefined ? opts[key] : schema[key].defaultValue(opts[key], opts)
    return accum
  }, {})
}

module.exports.validate = (opts, schema) => {
  if (!opts || !schema) throw new Error('opts and schema objects are required')
  const errors = reduce(keys(schema), (accum, key) => {
    if (schema[key].validate(opts[key], opts)) return accum
    return accum.concat({ key, message: schema[key].message, value: opts[key] })
  }, [])
  return { valid: !errors.length, errors }
}
