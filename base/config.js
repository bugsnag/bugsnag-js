const { filter, reduce, keys, isArray } = require('./lib/es-utils')
const positiveIntIfDefined = require('./lib/positive-int-check')

module.exports.schema = {
  apiKey: {
    defaultValue: () => null,
    message: 'is required',
    validate: value => typeof value === 'string' && value.length
  },
  appVersion: {
    defaultValue: () => null,
    message: 'should be a string',
    validate: value => value === null || (typeof value === 'string' && value.length)
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
  endpoint: {
    defaultValue: () => 'https://notify.bugsnag.com',
    message: 'should be a URL',
    validate: () => true
  },
  sessionEndpoint: {
    defaultValue: () => 'https://sessions.bugsnag.com',
    message: 'should be a URL',
    validate: () => true
  },
  autoCaptureSessions: {
    defaultValue: () => false,
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
  if (!opts || !schema) throw new Error('schema.mergeDefaults(opts, schema): opts and schema objects are required')
  return reduce(keys(schema), (accum, key) => {
    accum[key] = opts[key] !== undefined ? opts[key] : schema[key].defaultValue()
    return accum
  }, {})
}

module.exports.validate = (opts, schema) => {
  if (!opts || !schema) throw new Error('schema.mergeDefaults(opts, schema): opts and schema objects are required')
  const errors = reduce(keys(schema), (accum, key) => {
    if (schema[key].validate(opts[key])) return accum
    return accum.concat({ key, message: schema[key].message, value: opts[key] })
  }, [])
  return { valid: !errors.length, errors }
}
