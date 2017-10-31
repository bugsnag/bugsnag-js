const { filter, reduce, keys, isArray, includes } = require('./lib/es-utils')

const positiveIntIfDefined = value =>
  includes([ 'undefined', 'number' ], typeof value) &&
  parseInt('' + value, 10) === value &&
  value > 0

module.exports.schema = {
  apiKey: {
    defaultValue: () => null,
    message: '(String) apiKey is required',
    validate: value => typeof value === 'string' && value.length
  },
  autoNotify: {
    defaultValue: () => true,
    message: '(Boolean) autoNotify should be true or false',
    validate: value => value === true || value === false
  },
  beforeSend: {
    defaultValue: () => [],
    message: '(Array[Function]) beforeSend should only contain functions',
    validate: value => typeof value === 'function' || (isArray(value) && filter(value, f => typeof f === 'function').length === value.length)
  },
  endpoint: {
    defaultValue: () => '//notify.bugsnag.com',
    message: '(String) endpoint should be set',
    validate: () => true
  },
  notifyReleaseStages: {
    defaultValue: () => null,
    message: '(Array[String]) notifyReleaseStages should only contain strings',
    validate: value => value === null || (isArray(value) && filter(value, f => typeof f === 'string').length === value.length)
  },
  releaseStage: {
    defaultValue: () => 'production',
    message: '(String) releaseStage should be set',
    validate: value => typeof value === 'string' && value.length
  },
  eventWindowSize: {
    defaultValue: () => 60 * 1000, // one minute
    message: '(Number) eventWindowSize must be a number if specified',
    validate: positiveIntIfDefined
  },
  maxEventsPerWindow: {
    defaultValue: () => 100,
    message: '(Number) maxEventsPerWindow must be a number if specified',
    validate: positiveIntIfDefined
  },
  maxDuplicateEventsPerWindow: {
    defaultValue: () => 10,
    message: '(Number) maxDuplicateEventsPerWindow must be a number if specified',
    validate: positiveIntIfDefined
  },
  maxBreadcrumbs: {
    defaultValue: () => 20,
    message: '(Number) maxBreadcrumbs must be a number (≤40) if specified',
    validate: value => positiveIntIfDefined(value) && (value === undefined || value <= 40)
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
