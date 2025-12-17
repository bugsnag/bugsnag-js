const redactValues = require('./redact-values')
const defaultBaseURL = 'http://invalid-base.com'

module.exports = function (url, redactedKeys) {
  const urlObj = new URL(url, defaultBaseURL) // base needed for relative URLs
  const params = new URLSearchParams(urlObj.search)
  const redactedParams = redactValues(Object.fromEntries(params), redactedKeys)
  urlObj.search = new URLSearchParams(redactedParams).toString()
  const urlString = decodeURI(urlObj.toString())
  return urlString.startsWith(defaultBaseURL)
    ? urlString.slice(defaultBaseURL.length)
    : urlString
}
