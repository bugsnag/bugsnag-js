const { includes } = require('./es-utils')

module.exports = value =>
  includes([ 'undefined', 'number' ], typeof value) &&
  parseInt('' + value, 10) === value &&
  value > 0
