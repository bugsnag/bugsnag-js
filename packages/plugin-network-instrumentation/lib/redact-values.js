/**
 * Redact values in an array of objects based on a list of keys
 * @param {Record<string, unknown>} object
 * @param {string[]} keys
 * @returns
 */
module.exports = function (object, keys) {
  const lowercasedKeys = keys.map(key => key.toLowerCase())
  Object.keys(object).forEach((key) => {
    if (lowercasedKeys.includes(key.toLowerCase())) {
      object[key] = '[REDACTED]'
    }
  })
  return object
}
