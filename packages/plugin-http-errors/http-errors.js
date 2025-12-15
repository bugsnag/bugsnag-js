/**
 * @bugsnag/plugin-http-errors
 * A plugin to automatically capture and report HTTP errors
 */

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
  const normalizedCodes = Array.isArray(httpErrorCodes) ? httpErrorCodes : [httpErrorCodes]

  /**
   * Check if a status code should be captured
   * @param {number} statusCode - HTTP status code
   * @returns {boolean} True if should be captured
   */
  const shouldCaptureStatusCode = (statusCode) => {
    return normalizedCodes.some(code => {
      if (typeof code === 'number') {
        return code === statusCode
      }
      if (code && typeof code === 'object' && 'min' in code && 'max' in code) {
        return statusCode >= code.min && statusCode <= code.max
      }
      return false
    })
  }

  /**
   * Truncate string to max length
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  const truncate = (str, maxLength) => {
    if (!str || str.length <= maxLength) return str
    return str.substring(0, maxLength)
  }

  /**
   * Parse query parameters from URL
   * @param {string} url - URL string
   * @returns {Object} Parsed query parameters
   */
  const parseQueryParams = (url) => {
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

  /**
   * Convert Headers object to plain object
   * @param {Headers} headers - Headers object
   * @returns {Object} Plain object with header key-value pairs
   */
  const headersToObject = (headers) => {
    if (!headers) return {}

    const obj = {}
    if (headers.entries) {
      for (const [key, value] of headers.entries()) {
        obj[key] = value
      }
    } else if (headers.forEach) {
      headers.forEach((value, key) => {
        obj[key] = value
      })
    }
    return obj
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL string
   * @returns {string} Domain
   */
  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.host
    } catch (e) {
      return 'unknown'
    }
  }

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
        const { fetchTracker } = requestTrackerPlugin

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
      }

      function handleHttpError (startContext, endContext) {
        // Check if we should capture this status code
        if (!shouldCaptureStatusCode(endContext.status)) {
          return
        }

        // Extract request information
        const url = startContext.url
        const method = startContext.method
        const domain = extractDomain(url)

        // Extract request body
        let requestBody = ''
        let requestBodyLength = 0
        if (startContext.init && startContext.init.body) {
          const bodyStr = typeof startContext.init.body === 'string' ? startContext.init.body : String(startContext.init.body)
          requestBodyLength = bodyStr.length
          requestBody = truncate(bodyStr, maxRequestSize)
        }

        // Create request and response objects for callback
        const requestObj = {
          url,
          httpMethod: method,
          headers: headersToObject(startContext.init && startContext.init.headers),
          params: parseQueryParams(url),
          body: requestBody,
          bodyLength: requestBodyLength
        }

        const responseObj = {
          statusCode: endContext.status,
          headers: headersToObject(endContext.response && endContext.response.headers)
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
