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
   * Convert Headers object to plain object
   * @param {Headers} headers - Headers object
   * @returns {Object} Plain object with lowercase keys
   */
  const headersToObject = (headers) => {
    const obj = {}
    if (headers && headers.forEach) {
      headers.forEach((value, key) => {
        obj[key.toLowerCase()] = value
      })
    }
    return obj
  }

  /**
   * Normalize headers object to lowercase keys
   * @param {Object} headers - Headers object
   * @returns {Object} Normalized headers
   */
  const normalizeHeaders = (headers) => {
    if (!headers) return {}
    if (headers instanceof Headers) return headersToObject(headers)
    if (typeof headers === 'object') {
      const normalized = {}
      Object.keys(headers).forEach(key => {
        normalized[key.toLowerCase()] = headers[key]
      })
      return normalized
    }
    return {}
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
        const startTime = Date.now()
        let response

        try {
          response = await originalFetch.call(this, input, init)
        } catch (error) {
          // Network errors are already handled by other error handlers
          throw error
        }

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

        // Clone response to read body without consuming it
        const responseClone = response.clone ? response.clone() : response
        let responseBody = ''
        let responseBodyLength = 0

        try {
          const fullResponseBody = await responseClone.text()
          responseBodyLength = fullResponseBody.length
          responseBody = truncate(fullResponseBody, maxResponseSize)
        } catch (e) {
          client._logger.warn('Failed to read response body', e)
        }

        // Create request and response objects for callback
        const requestObj = {
          url,
          httpMethod: method,
          headers: normalizeHeaders(init.headers),
          params: parseQueryParams(url),
          body: requestBody,
          bodyLength: requestBodyLength
        }

        const responseObj = {
          status: response.status,
          headers: normalizeHeaders(response.headers),
          body: responseBody,
          bodyLength: responseBodyLength
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
        const error = new Error(`${responseObj.status}: ${requestObj.url}`)
        error.name = 'HTTPError'

        client.notify(error, (event) => {
          // Set context for grouping
          event.context = `${method} ${domain}`

          // Set error details
          event.errors[0].errorClass = 'HTTPError'
          event.errors[0].errorMessage = `${responseObj.status}: ${requestObj.url}`

          // Add request metadata (using potentially modified values)
          event.addMetadata('request', requestObj)

          // Add response metadata (using potentially modified values)
          event.addMetadata('response', {
            statusCode: responseObj.status,
            headers: responseObj.headers,
            body: responseObj.body,
            bodyLength: responseObj.bodyLength
          })

          return true
        })

        return response
      }
    }
  }
}

// add a default export for ESM modules without interop
module.exports.default = module.exports
