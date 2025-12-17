/**
   * Convert Headers object to plain object
   * @param {Headers} headers - Headers object
   * @returns {Object} Plain object with header key-value pairs
   */
module.exports = function (headers) {
  if (!headers) return {}

  const obj = {}
  if (headers.entries) {
    for (const [key, value] of headers.entries()) {
      obj[key] = value
    }
  } else if (headers.forEach) {
    headers.forEach((value, key) => {
      obj[key] = value
    })
  }
  return obj
}
