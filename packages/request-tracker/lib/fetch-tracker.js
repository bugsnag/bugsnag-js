const headersToObject = require('./headers-to-object')
const RequestTracker = require('./request-tracker')

/**
 * Create fetch request tracker with singleton pattern
 * @param {Object} global - Global object (window or global)
 * @param {Object} options - Configuration options
 * @returns {Object} Tracker instance
 */
function createFetchTracker (global, options = {}) {
  // only patch it if it exists and if it is not a polyfill (patching a polyfilled
  // fetch() results in duplicate breadcrumbs for the same request because the
  // implementation uses XMLHttpRequest which is also patched)
  if (!('fetch' in global) || global.fetch.polyfill) return

  // Use singleton pattern - one tracker per global context
  if (!global.__bugsnag_fetch_tracker__) {
    const tracker = new RequestTracker()
    const originalFetch = global.fetch

    global.fetch = function wrappedFetch (urlOrRequest, options = {}) {
      let url = null
      let method = 'GET'

      if (urlOrRequest && typeof urlOrRequest === 'object') {
        url = urlOrRequest.url
        if (options && 'method' in options) {
          method = options.method
        } else if (urlOrRequest && 'method' in urlOrRequest) {
          method = urlOrRequest.method
        }
      } else {
        url = urlOrRequest
        if (options && 'method' in options) {
          method = options.method
        }
      }

      if (method === undefined) {
        method = 'GET'
      }

      let requestHeaders = {}
      if (options && options.headers) {
        // eslint-disable-next-line no-undef
        if (options.headers instanceof Headers) {
          requestHeaders = headersToObject(options.headers)
        } else if (typeof options.headers === 'object') {
          requestHeaders = options.headers
        }
      }

      const startTime = Date.now()
      const context = {
        url: String(url),
        method: String(method),
        startTime,
        type: 'fetch',
        input: urlOrRequest,
        headers: requestHeaders,
        body: options.body
      }

      const { onRequestEnd } = tracker.start(context)

      // Call original fetch
      return originalFetch.call(this, ...arguments).then(
        response => {
          onRequestEnd({
            endTime: Date.now(),
            status: response.status,
            state: 'success',
            headers: headersToObject(response.headers)
          })
          return response
        },
        error => {
          onRequestEnd({
            endTime: Date.now(),
            state: 'error',
            error
          })
          throw error
        }
      )
    }

    // Store tracker and mark as active
    global.__bugsnag_fetch_tracker__ = tracker

    // Restore function for development
    if (process.env.NODE_ENV !== 'production') {
      tracker._restore = () => {
        global.fetch = originalFetch
        delete global.__bugsnag_fetch_tracker__
      }
    }
  }

  return global.__bugsnag_fetch_tracker__
}

module.exports = createFetchTracker
