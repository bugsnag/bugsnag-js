const reduce = require('./reduce')

// Array#filter
module.exports = (arr, fn) =>
  reduce(arr, (accum, item, i, arr) => !fn(item, i, arr) ? accum : accum.concat(item), [])
