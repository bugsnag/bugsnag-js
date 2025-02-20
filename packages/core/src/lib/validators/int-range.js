module.exports = (min = 1, max = Infinity) => value =>
  typeof value === 'number' &&
  parseInt('' + value, 10) === value &&
  value >= min && value <= max
