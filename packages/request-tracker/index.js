const RequestTracker = require('./lib/request-tracker')
const createFetchTracker = require('./lib/fetch-tracker')
const createXhrTracker = require('./lib/xhr-tracker')
const { createUrlFilter, getDuration } = require('./lib/url-helpers')

/**
 * Create an auto-loading request tracker plugin
 * @param {Array} ignoredUrls - Additional URLs to ignore
 * @param {Object} global - Global object (window or global)
 * @returns {Object} Bugsnag plugin
 */
function createRequestTrackerPlugin (ignoredUrls = [], global = window) {
  return {
    name: 'requestTracker',
    load: (client) => {
      try {
        const fetchTracker = createFetchTracker(global)
        const xhrTracker = createXhrTracker(global)
        const urlFilter = createUrlFilter(client, ignoredUrls)

        return {
          fetchTracker,
          xhrTracker,
          urlFilter,
          getDuration
        }
      } catch (error) {
        client._logger.error('Failed to load request tracker:', error)
        throw new Error('Request tracking is not available: ' + error.message)
      }
    }
  }
}

module.exports = {
  RequestTracker,
  createFetchTracker,
  createXhrTracker,
  createUrlFilter,
  getDuration,
  createRequestTrackerPlugin
}
