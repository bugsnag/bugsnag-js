/**
 * @bugsnag/plugin-http-errors
 * A plugin to automatically capture and report HTTP errors
 */

const DEFAULT_HTTP_ERROR_CODES = [{ min: 400, max: 599 }]
const DEFAULT_MAX_RESPONSE_SIZE = 20000
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
module.exports = (config = {}) => {
  const {
    httpErrorCodes = DEFAULT_HTTP_ERROR_CODES,
    maxResponseSize = DEFAULT_MAX_RESPONSE_SIZE,
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
   * Extract domain from URL
   * @param {string} url - URL string
   * @returns {string} Domain
   */
  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (e) {
      return 'unknown'
    }
  }

  return {
    name: 'httpErrors',
    load: (client) => {
      // Store original fetch
      const originalFetch = global.fetch

      if (!originalFetch) {
        client._logger.warn('fetch is not available, HTTP errors plugin will not work')
        return
      }

      // Wrap fetch
      global.fetch = async function wrappedFetch (input, init = {}) {
        const response = await originalFetch.call(this, input, init)

        // Check if we should capture this status code
        if (!shouldCaptureStatusCode(response.status)) {
          return response
        }

        // Extract request information
        const url = typeof input === 'string' ? input : input.url
        const method = (init.method || 'GET').toUpperCase()
        const domain = extractDomain(url)

        // Extract request body
        let requestBody = ''
        let requestBodyLength = 0
        if (init.body) {
          const bodyStr = typeof init.body === 'string' ? init.body : String(init.body)
          requestBodyLength = bodyStr.length
          requestBody = truncate(bodyStr, maxRequestSize)
        }

        // Create request and response objects for callback
        const requestObj = {
          url,
          httpMethod: method,
          headers: init.headers,
          params: parseQueryParams(url),
          body: requestBody,
          bodyLength: requestBodyLength
        }

        const responseObj = {
          statusCode: response.status,
          headers: response.headers
        }

        // Call onHttpError callback if provided
        if (onHttpError) {
          const result = onHttpError({ request: requestObj, response: responseObj })

          // If onHttpError returns false, don't capture
          if (result === false) {
            return response
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

        return response
      }
    }
  }
}

// add a default export for ESM modules without interop
module.exports.default = module.exports
