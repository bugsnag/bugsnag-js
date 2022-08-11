module.exports = function (array, callback) {
  var list = Object(array)
  // Makes sures is always has an positive integer as length.
  var length = list.length >>> 0
  var thisArg = arguments[1]

  for (var i = 0; i < length; i++) {
    if (callback.call(thisArg, list[i], i, list)) {
      return i
    }
  }
  return -1
}
