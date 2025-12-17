/**
   * Extract domain from URL
   * @param {string} url - URL string
   * @returns {string} Domain
   */
module.exports = function (url) {
  try {
    const urlObj = new URL(url)
    return urlObj.host
  } catch (e) {
    return 'unknown'
  }
}
