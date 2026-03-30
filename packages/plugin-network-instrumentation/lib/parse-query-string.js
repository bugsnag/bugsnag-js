/**
 * Parse a query string into an object
 * @param {string} queryString - Query string (e.g., "key=value&foo=bar")
 * @returns {Object<string, string>} Parsed query parameters as key-value pairs
 */
module.exports = function (queryString) {
  const params = {}
  if (!queryString) {
    return params
  }

  const pairs = queryString.split('&').filter(pair => pair.length > 0)
  pairs.forEach(pair => {
    const [key, value] = pair.split('=')
    params[decodeURIComponent(key)] = decodeURIComponent(value || '')
  })

  return params
}
