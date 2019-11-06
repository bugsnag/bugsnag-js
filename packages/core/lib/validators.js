const { filter, isArray } = require('./es-utils')

exports.intRange = (min = 1, max = Infinity) => value =>
  typeof value === 'number' &&
  parseInt('' + value, 10) === value &&
  value >= min && value <= max

exports.stringWithLength = value => typeof value === 'string' && !!value.length

exports.arrayOfStrings = value => value === null || (isArray(value) && filter(value, f => typeof f === 'string').length === value.length)
