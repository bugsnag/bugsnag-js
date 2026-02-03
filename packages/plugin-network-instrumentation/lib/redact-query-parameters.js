const redactValues = require('./redact-values')

function isAbsoluteURL (url) {
  try {
    // eslint-disable-next-line no-new
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

module.exports = function (url, redactedKeys) {
  const isAbsolute = isAbsoluteURL(url)
  const base = isAbsolute ? undefined : 'http://localhost'

  // Parse the URL - use a base only for relative URLs
  const urlObj = new URL(url, base)

  // Extract query string manually from the original URL
  const queryStart = url.indexOf('?')
  const hashStart = url.indexOf('#')

  let queryString = ''
  if (queryStart !== -1) {
    const queryEnd = hashStart !== -1 && hashStart > queryStart ? hashStart : url.length
    queryString = url.substring(queryStart + 1, queryEnd)
  }

  // Convert URLSearchParams to object without using Object.fromEntries()
  const params = new URLSearchParams(queryString)
  const paramsObject = {}
  params.forEach((value, key) => {
    paramsObject[key] = value
  })

  const redactedParams = redactValues(paramsObject, redactedKeys)
  const redactedQueryString = new URLSearchParams(redactedParams).toString()

  // Build the result URL manually
  let result = urlObj.pathname
  if (redactedQueryString) {
    result += '?' + redactedQueryString
  }
  if (urlObj.hash) {
    result += urlObj.hash
  }

  // Return appropriate format based on original URL type
  if (isAbsolute) {
    return decodeURI(urlObj.origin + result)
  }

  return decodeURI(result)
}
