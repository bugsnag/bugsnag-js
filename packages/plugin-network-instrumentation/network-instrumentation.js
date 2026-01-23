/**
 * @bugsnag/plugin-network-instrumentation
 * A plugin to automatically capture and report HTTP errors
 */

const extractDomain = require('./lib/extract-domain')
const parseQueryParams = require('./lib/parse-query-params')
const redactQueryParameters = require('./lib/redact-query-parameters')
const shouldCaptureStatusCode = require('./lib/should-capture-status-code')
const truncate = require('./lib/truncate')

const DEFAULT_HTTP_ERROR_CODES = [{ min: 400, max: 599 }]
const DEFAULT_MAX_RESPONSE_SIZE = 0
const DEFAULT_MAX_REQUEST_SIZE = 0

/**
 * Creates the HTTP errors plugin with configuration
 * @param {Object} config - Plugin configuration
 * @param {Array|Object|number} config.httpErrorCodes - Error codes to capture
 * @param {number} config.maxResponseSize - Maximum response body size to capture
 * @param {number} config.maxRequestSize - Maximum request body size to capture
 * @param {Function} config.onHttpError - Callback for intercepting HTTP errors
 * @returns {Object} Bugsnag plugin
 */
module.exports = (config = {}, global = window) => {
  const {
    httpErrorCodes = DEFAULT_HTTP_ERROR_CODES,
    maxResponseSize = DEFAULT_MAX_RESPONSE_SIZE,
    maxRequestSize = DEFAULT_MAX_REQUEST_SIZE,
    onHttpError
  } = config

  // Normalize httpErrorCodes to an array
  const normalizedStatusCodes = Array.isArray(httpErrorCodes) ? httpErrorCodes : [httpErrorCodes]

  let restoreFunctions = []
  const plugin = {
    name: 'httpErrors',
    load: (client) => {
      // Try to get existing request tracker
      let requestTrackerPlugin = client.getPlugin('requestTracker')

      // Auto-load request tracker if not present
      if (!requestTrackerPlugin) {
        try {
          const { createRequestTrackerPlugin } = require('@bugsnag/request-tracker')
          const trackerPlugin = createRequestTrackerPlugin([], global)
          client._loadPlugin(trackerPlugin)
          requestTrackerPlugin = client.getPlugin('requestTracker')
        } catch (error) {
          client._logger.warn('Failed to auto-load request tracker, using direct fetch patching:', error.message)
        }
      }

      // Use shared request tracker if available
      if (requestTrackerPlugin) {
        const { fetchTracker, xhrTracker } = requestTrackerPlugin

        if (fetchTracker) {
          restoreFunctions.push(fetchTracker._restore)
          fetchTracker.onStart((startContext) => {
            return {
              onRequestEnd: (endContext) => {
                handleHttpError(startContext, endContext)
              }
            }
          })
        }
        if (xhrTracker) {
          restoreFunctions.push(xhrTracker._restore)
          xhrTracker.onStart((startContext) => {
            return {
              onRequestEnd: (endContext) => {
                handleHttpError(startContext, endContext)
              }
            }
          })
        }
      }

      function handleHttpError (startContext, endContext) {
        // Check if we should capture this status code
        if (!shouldCaptureStatusCode(normalizedStatusCodes, endContext.status)) return

        try {
          // Extract request information
          const url = startContext.url
          const requestParams = parseQueryParams(url)
          const method = startContext.method
          const domain = extractDomain(url)

          // Create request and response objects for callback
          const requestObj = {
            url: startContext.url,
            httpMethod: startContext.method,
            headers: startContext.headers,
            params: requestParams
          }
          const responseObj = {
            statusCode: endContext.status,
            headers: endContext.headers,
            body: endContext.body,
            bodyLength: endContext.body ? endContext.body.length : undefined
          }

          // Call onHttpError callback if provided
          if (onHttpError) {
            const result = onHttpError({ request: requestObj, response: responseObj })

            // If onHttpError returns false, don't capture
            if (result === false) {
              return
            }
          }

          // Truncate request body
          if (maxRequestSize > 0 && startContext.body) {
            requestObj.body = truncate(startContext.body, maxRequestSize)
            requestObj.bodyLength = startContext.body.length
          }

          // Truncate response body - XHR only
          if (maxResponseSize > 0 && endContext.body) {
            responseObj.body = truncate(endContext.body, maxResponseSize)
            responseObj.bodyLength = endContext.body.length
          }

          // Strip query parameters from URL
          if (requestObj.url !== '[REDACTED]') {
            requestObj.url = redactQueryParameters(requestObj.url, client._config.redactedKeys)
          }

          // Create error and notify
          const error = new Error(`${responseObj.statusCode}: ${requestObj.url}`)
          error.name = 'HTTPError'

          const handledState = {
            severity: 'error',
            unhandled: true,
            severityReason: { type: 'httpError' }
          }

          const event = client.Event.create(
            error,
            true,
            handledState,
            'http errors plugin',
            0
          )

          event.request = requestObj
          event.response = responseObj
          event.context = `${method} ${domain}`

          client._notify(event)
        } catch (err) {
          client._logger.error('Failed to process HTTP error:', err.message)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    plugin.destroy = () => {
      restoreFunctions.forEach(fn => fn())
      restoreFunctions = []
    }
  }

  return plugin
}
