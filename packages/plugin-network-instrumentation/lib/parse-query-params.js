/**
   * Parse query parameters from URL
   * @param {string} url - URL string
   * @returns {Object} Parsed query parameters
   */
module.exports = function (url) {
  try {
    const queryStart = url.indexOf('?')
    const hashStart = url.indexOf('#')

    let queryString = ''
    if (queryStart !== -1) {
      const queryEnd = hashStart !== -1 && hashStart > queryStart ? hashStart : url.length
      queryString = url.substring(queryStart + 1, queryEnd)
    }

    // convert query string to object without using UrlSearchParams
    const queryStringObject = {}
    const pairs = queryString.split('&').filter(pair => pair.length > 0)
    pairs.forEach(pair => {
      const [key, value] = pair.split('=')
      queryStringObject[decodeURIComponent(key)] = decodeURIComponent(value || '')
    })

    return queryStringObject
  } catch (e) {
    return {}
  }
}
