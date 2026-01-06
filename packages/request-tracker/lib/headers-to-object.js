/**
   * Convert Headers object to plain object
   * @param {Headers} headers - Headers object
   * @returns {Object} Plain object with header key-value pairs
   */
module.exports = function (headers) {
  if (!headers) return {}

  const obj = {}
  if (typeof headers.entries === 'function') {
    var iterator = headers.entries()
    var entry = iterator.next()
    while (!entry.done) {
      var key = entry.value[0]
      var value = entry.value[1]
      obj[key] = value
      entry = iterator.next()
    }
  } else if (headers.forEach) {
    headers.forEach((value, key) => {
      obj[key] = value
    })
  }
  return obj
}
