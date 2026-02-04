/**
   * Extract domain from URL
   * @param {string} url - URL string
   * @returns {string} Domain
   */
module.exports = function (url) {
  try {
    const isAbsolute = /^https?:\/\//i.test(url)
    if (!isAbsolute) {
      return 'unknown'
    }

    const urlWithoutProtocol = url.replace(/^https?:\/\//i, '')

    const firstSlashIndex = urlWithoutProtocol.indexOf('/')
    if (firstSlashIndex !== -1) {
      return urlWithoutProtocol.substring(0, firstSlashIndex)
    }

    return urlWithoutProtocol
  } catch (e) {
    return 'unknown'
  }
}
