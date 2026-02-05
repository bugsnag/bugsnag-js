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

    // Find the earliest occurrence of '/', '?', or '#' to determine the domain boundary
    const slashIndex = urlWithoutProtocol.indexOf('/')
    const queryIndex = urlWithoutProtocol.indexOf('?')
    const hashIndex = urlWithoutProtocol.indexOf('#')
    let endIndex = urlWithoutProtocol.length
    if (slashIndex !== -1 && slashIndex < endIndex) {
      endIndex = slashIndex
    }
    if (queryIndex !== -1 && queryIndex < endIndex) {
      endIndex = queryIndex
    }
    if (hashIndex !== -1 && hashIndex < endIndex) {
      endIndex = hashIndex
    }

    return urlWithoutProtocol.substring(0, endIndex)
  } catch (e) {
    return 'unknown'
  }
}
