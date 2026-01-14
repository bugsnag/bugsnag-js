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
  const params = new URLSearchParams(urlObj.search)

  // Convert URLSearchParams to object without using Object.fromEntries()
  const paramsObject = {}
  params.forEach((value, key) => {
    paramsObject[key] = value
  })

  const redactedParams = redactValues(paramsObject, redactedKeys)
  urlObj.search = new URLSearchParams(redactedParams).toString()

  // Return appropriate format based on original URL type
  if (isAbsolute) {
    return decodeURI(urlObj.toString())
  }

  // For relative URLs, return only the path + search + hash components
  const relativePart = urlObj.pathname + urlObj.search + urlObj.hash
  return decodeURI(relativePart)
}
