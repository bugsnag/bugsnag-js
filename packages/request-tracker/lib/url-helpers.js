const includes = require('@bugsnag/core/lib/es-utils/includes')

/**
 * Check if a URL should be ignored for tracking
 * @param {string} url - URL to check
 * @param {Array} ignoredUrls - Array of URLs to ignore
 * @returns {boolean} True if URL should be ignored
 */
function shouldIgnoreUrl (url, ignoredUrls = []) {
  if (!url || typeof url !== 'string') return true

  // Remove query parameters for comparison
  const urlWithoutQuery = url.replace(/\?.*$/, '')

  return includes(ignoredUrls, urlWithoutQuery)
}

/**
 * Create URL filtering function for Bugsnag endpoints and custom ignored URLs
 * @param {Object} client - Bugsnag client instance
 * @param {Array} additionalIgnoredUrls - Additional URLs to ignore
 * @returns {Function} URL filtering function
 */
function createUrlFilter (client, additionalIgnoredUrls = []) {
  const ignoredUrls = [
    client._config.endpoints.notify,
    client._config.endpoints.sessions
  ].concat(additionalIgnoredUrls).filter(Boolean)

  return (url) => shouldIgnoreUrl(url, ignoredUrls)
}

/**
 * Calculate duration from start time
 * @param {number} startTime - Start timestamp
 * @returns {number} Duration in milliseconds
 */
function getDuration (startTime) {
  return startTime && Date.now() - startTime
}

module.exports = {
  shouldIgnoreUrl,
  createUrlFilter,
  getDuration
}
