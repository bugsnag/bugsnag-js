const reduce = require('./reduce')

// Array#map
module.exports = (arr, fn) =>
  reduce(arr, (accum, item, i, arr) => accum.concat(fn(item, i, arr)), [])
