/**
   * Convert Headers object to plain object
   * @param {Headers} headers - Headers object
   * @returns {Object} Plain object with header key-value pairs
   */
const headersToObject = (headers) => {
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

module.exports = headersToObject
