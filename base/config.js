const { filter, reduce, keys, isArray, includes } = require('./lib/es-utils')
const { positiveIntIfDefined, stringWithLength } = require('./lib/validators')

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
  autoNotify: {
    defaultValue: () => true,
    message: 'should be true|false',
    validate: value => value === true || value === false
  },
  beforeSend: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: value => typeof value === 'function' || (isArray(value) && filter(value, f => typeof f === 'function').length === value.length)
  },
  endpoints: {
    defaultValue: () => ({
      notify: 'https://notify.bugsnag.com',
      sessions: 'https://sessions.bugsnag.com'
    }),
    message: 'should be an object containing endpoint URLs { notify, sessions }. sessions is optional if autoCaptureSessions=false',
    validate: (val, obj) =>
      // first, ensure it's an object
      (val && typeof val === 'object') &&
      (
        // endpoints.notify must always be set
        stringWithLength(val.notify) &&
        // endpoints.sessions must be set unless session tracking is explicitly off
        (obj.autoCaptureSessions === false || stringWithLength(val.sessions))
      ) &&
      // ensure no keys other than notify/session are set on endpoints object
      filter(keys(val), k => !includes([ 'notify', 'sessions' ], k)).length === 0
  },
  autoCaptureSessions: {
    defaultValue: (val, opts) => opts.endpoints === undefined || (!!opts.endpoints && !!opts.endpoints.sessions),
    message: 'should be true|false',
    validate: val => val === true || val === false
  },
  notifyReleaseStages: {
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
    defaultValue: () => 20,
    message: 'should be a number ≤40',
    validate: value => value === 0 || (positiveIntIfDefined(value) && (value === undefined || value <= 40))
  },
  autoBreadcrumbs: {
    defaultValue: () => true,
    message: 'should be true|false',
    validate: (value) => typeof value === 'boolean'
  },
  user: {
    defaultValue: () => null,
    message: '(object) user should be an object',
    validate: (value) => typeof value === 'object'
  },
  metaData: {
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
        [ 'debug', 'info', 'warn', 'error' ],
        (accum, method) => accum && typeof value[method] === 'function',
        true
      ))
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
