exports.intRange = (min = 1, max = Infinity) => value =>
  typeof value === 'number' &&
  parseInt('' + value, 10) === value &&
  value >= min && value <= max

exports.stringWithLength = value => typeof value === 'string' && !!value.length
