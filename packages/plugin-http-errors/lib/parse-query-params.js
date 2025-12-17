/**
   * Parse query parameters from URL
   * @param {string} url - URL string
   * @returns {Object} Parsed query parameters
   */
module.exports = function (url) {
  try {
    const urlObj = new URL(url)
    const params = {}
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  } catch (e) {
    return {}
  }
}
