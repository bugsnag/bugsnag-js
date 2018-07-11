const { includes } = require('./es-utils')

exports.positiveIntIfDefined = value =>
  includes([ 'undefined', 'number' ], typeof value) &&
  parseInt('' + value, 10) === value &&
  value > 0

exports.stringWithLength = value => typeof value === 'string' && !!value.length
