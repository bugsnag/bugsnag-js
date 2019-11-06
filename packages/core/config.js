const { filter, reduce, keys, isArray, includes } = require('./lib/es-utils')
const { intRange, stringWithLength, arrayOfStrings } = require('./lib/validators')

const listOfCallbacks = {
  defaultValue: () => [],
  message: 'should be a function or array of functions',
  validate: value => typeof value === 'function' || (isArray(value) && filter(value, f => typeof f === 'function').length === value.length)
}

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
    defaultValue: () => undefined,
    message: 'should be true|false',
    validate: (value) => value === true || value === false || value === undefined
  },
  autoDetectUnhandledRejections: {
    defaultValue: () => undefined,
    message: 'should be true|false',
    validate: (value) => value === true || value === false || value === undefined
  },
  context: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: value => value === undefined || stringWithLength(value)
  },
  onError: listOfCallbacks,
  onBreadcrumb: listOfCallbacks,
  onSession: listOfCallbacks,
  endpoints: {
    defaultValue: () => ({
      notify: 'https://notify.bugsnag.com',
      sessions: 'https://sessions.bugsnag.com'
    }),
    message: 'should be an object containing endpoint URLs { notify, sessions }. sessions is optional if autoTrackSessions=false',
    validate: (val, obj) =>
      // first, ensure it's an object
      (val && typeof val === 'object') &&
      (
        // endpoints.notify must always be set
        stringWithLength(val.notify) &&
        // endpoints.sessions must be set unless session tracking is explicitly off
        (obj.autoTrackSessions === false || stringWithLength(val.sessions))
      ) &&
      // ensure no keys other than notify/session are set on endpoints object
      filter(keys(val), k => !includes(['notify', 'sessions'], k)).length === 0
  },
  autoTrackSessions: {
    defaultValue: (val, opts) => opts.endpoints === undefined || (!!opts.endpoints && !!opts.endpoints.sessions),
    message: 'should be true|false',
    validate: val => val === true || val === false
  },
  enabledReleaseStages: {
    defaultValue: () => null,
    message: 'should be an array of strings',
    validate: value => arrayOfStrings
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
    defaultValue: () => ['error', 'user', 'log', 'process', 'state', 'navigation', 'request', 'manual'],
    message: 'should be an array of strings',
    validate: (value) => arrayOfStrings
  },
  user: {
    defaultValue: () => null,
    message: 'user should be an object with { id, name, email }',
    validate: val =>
      val === null ||
      (val && typeof val === 'object' && filter(keys(val), k => !includes(['id', 'name', 'email'], k)).length === 0)
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
  redactedKeys: {
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
