// Array#includes
module.exports = (arr, x) =>
  arr.reduce((accum, item, i, arr) => accum === true || item === x, false)
