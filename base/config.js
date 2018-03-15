const { filter, reduce, keys, isArray } = require('./lib/es-utils')
const positiveIntIfDefined = require('./lib/positive-int-check')

module.exports.schema = {
  apiKey: {
    defaultValue: () => null,
    message: '(string) apiKey is required',
    validate: value => typeof value === 'string' && value.length
  },
  appVersion: {
    defaultValue: () => null,
    message: '(string) appVersion should have a value if supplied',
    validate: value => value === null || (typeof value === 'string' && value.length)
  },
  autoNotify: {
    defaultValue: () => true,
    message: '(boolean) autoNotify should be true or false',
    validate: value => value === true || value === false
  },
  beforeSend: {
    defaultValue: () => [],
    message: '(array[Function]) beforeSend should only contain functions',
    validate: value => typeof value === 'function' || (isArray(value) && filter(value, f => typeof f === 'function').length === value.length)
  },
  endpoint: {
    defaultValue: () => 'https://notify.bugsnag.com',
    message: '(string) endpoint should be set',
    validate: () => true
  },
  sessionEndpoint: {
    defaultValue: () => 'https://sessions.bugsnag.com',
    message: '(string) sessionEndpoint should be set',
    validate: () => true
  },
  autoCaptureSessions: {
    defaultValue: () => false,
    message: '(boolean) autoCaptureSessions should be true/false',
    validate: val => val === true || val === false
  },
  notifyReleaseStages: {
    defaultValue: () => null,
    message: '(array[string]) notifyReleaseStages should only contain strings',
    validate: value => value === null || (isArray(value) && filter(value, f => typeof f === 'string').length === value.length)
  },
  releaseStage: {
    defaultValue: () => 'production',
    message: '(string) releaseStage should be set',
    validate: value => typeof value === 'string' && value.length
  },
  maxBreadcrumbs: {
    defaultValue: () => 20,
    message: '(number) maxBreadcrumbs must be a number (≤40) if specified',
    validate: value => value === 0 || (positiveIntIfDefined(value) && (value === undefined || value <= 40))
  },
  autoBreadcrumbs: {
    defaultValue: () => true,
    message: '(boolean) autoBreadcrumbs should be true or false',
    validate: (value) => typeof value === 'boolean'
  },
  user: {
    defaultValue: () => null,
    message: '(object) user should be an object',
    validate: (value) => typeof value === 'object'
  },
  metaData: {
    defaultValue: () => null,
    message: '(object) metaData should be an object',
    validate: (value) => typeof value === 'object'
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
