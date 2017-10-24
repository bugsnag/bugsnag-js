const positiveIntIfDefined = value =>
  [ 'undefined', 'number' ].includes(typeof value) &&
  parseInt(value.toString(), 10) === value &&
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
    validate: value => typeof value === 'function' || (Array.isArray(value) && value.every(f => typeof f === 'function'))
  },
  endpoint: {
    defaultValue: () => '//notify.bugsnag.com',
    message: '(String) endpoint should be set',
    validate: () => true
  },
  notifyReleaseStages: {
    defaultValue: () => [ 'production' ],
    message: '(Array[String]) notifyReleaseStages should only contain strings',
    validate: value => Array.isArray(value) && value.every(f => typeof f === 'string')
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
  }
}

module.exports.mergeDefaults = (opts, schema) => {
  if (!opts || !schema) throw new Error('schema.mergeDefaults(opts, schema): opts and schema objects are required')
  return Object.keys(schema).reduce((accum, key) => {
    accum[key] = opts[key] !== undefined ? opts[key] : schema[key].defaultValue()
    return accum
  }, {})
}

module.exports.validate = (opts, schema) => {
  if (!opts || !schema) throw new Error('schema.mergeDefaults(opts, schema): opts and schema objects are required')
  const errors = Object.keys(schema).reduce((accum, key) => {
    if (schema[key].validate(opts[key])) return accum
    return accum.concat({ key, message: schema[key].message, value: opts[key] })
  }, [])
  return { valid: !errors.length, errors }
}
