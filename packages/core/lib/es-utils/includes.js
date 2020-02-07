const reduce = require('./reduce')
// Array#includes
module.exports = (arr, x) =>
  reduce(arr, (accum, item, i, arr) => accum === true || item === x, false)
