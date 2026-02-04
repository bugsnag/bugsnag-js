const parseQueryParams = require('./parse-query-params')
const redactValues = require('./redact-values')

module.exports = function (url, redactedKeys) {
  const paramsObject = parseQueryParams(url)
  const redactedParams = redactValues(paramsObject, redactedKeys)
  const redactedQueryString = Object.entries(redactedParams).map(([key, value]) => `${key}=${value}`).join('&')

  const queryStart = url.indexOf('?')
  const hashStart = url.indexOf('#')
  const hash = hashStart !== -1 ? url.substring(hashStart) : ''
  let result = queryStart !== -1 ? url.substring(0, queryStart) : url

  // Build the result URL manually
  if (redactedQueryString && redactedQueryString.length > 0) {
    result += '?' + redactedQueryString
  }
  if (hash) {
    result += hash
  }

  return result
}
