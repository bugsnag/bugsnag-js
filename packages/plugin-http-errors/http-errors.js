/**
 * @bugsnag/plugin-http-errors
 * A plugin to automatically capture and report HTTP errors
 */

const extractDomain = require('./lib/extract-domain')
const headersToObject = require('./lib/headers-to-object')
const parseQueryParams = require('./lib/parse-query-params')
const shouldCaptureStatusCode = require('./lib/should-capture-status-code')
const truncate = require('./lib/truncate')
const xhrResponseHeadersToObject = require('./lib/xhr-response-headers-to-object')
const redactValues = require('./lib/redact-values')
const redactQueryParameters = require('./lib/redact-query-parameters')

const DEFAULT_HTTP_ERROR_CODES = [{ min: 400, max: 599 }]
const DEFAULT_MAX_REQUEST_SIZE = 5000

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
      const redactedKeys = client._config.redactedKeys || []

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
        if (!shouldCaptureStatusCode(normalizedStatusCodes, endContext.status)) {
          return
        }

        // Extract request information
        const url = startContext.url
        const method = startContext.method
        const domain = extractDomain(url)

        // Redact query parameters in URL
        const redactedUrl = redactQueryParameters(url, redactedKeys)
        const redactedQueryParams = parseQueryParams(redactedUrl)

        // Extract request headers
        let requestHeaders = {}
        if (startContext.xhr && startContext.xhr._requestHeaders) {
          requestHeaders = headersToObject(startContext.xhr._requestHeaders)
        } else if (startContext.init && startContext.init.headers) {
          requestHeaders = headersToObject(startContext.init.headers)
        }

        // Extract request body
        let requestBody = ''
        let requestBodyLength = 0
        const initialBody = startContext.init ? startContext.init.body : startContext.body
        if (initialBody) {
          const bodyStr = String(initialBody)
          requestBody = truncate(bodyStr, maxRequestSize)
          requestBodyLength = bodyStr.length
        }

        // Extract response headers
        let responseHeaders = {}
        if (endContext.response && endContext.response.headers) {
          responseHeaders = headersToObject(endContext.response.headers)
        } else if (endContext.xhr && typeof endContext.xhr.getAllResponseHeaders === 'function') {
          responseHeaders = xhrResponseHeadersToObject(endContext.xhr.getAllResponseHeaders())
        }

        // Extract response body - XHR only
        let responseBody
        let responseBodyLength
        if (endContext.xhr && endContext.xhr.responseText) {
          responseBody = truncate(endContext.xhr.responseText, maxRequestSize)
          responseBodyLength = endContext.xhr.responseText.length
        }

        // Create request and response objects for callback
        const requestObj = {
          url: redactedUrl,
          httpMethod: method,
          headers: redactValues(requestHeaders, redactedKeys),
          params: redactedQueryParams,
          body: requestBody,
          bodyLength: requestBodyLength
        }
        const responseObj = {
          statusCode: endContext.status,
          headers: redactValues(responseHeaders, redactedKeys),
          body: responseBody,
          bodyLength: responseBodyLength
        }

        // Call onHttpError callback if provided
        if (onHttpError) {
          const result = onHttpError({ request: requestObj, response: responseObj })

          // If onHttpError returns false, don't capture
          if (result === false) {
            return
          }
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
