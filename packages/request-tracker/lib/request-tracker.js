/**
 * Singleton RequestTracker class for managing HTTP request instrumentation
 * Allows multiple plugins to register callbacks for the same requests
 */
class RequestTracker {
  constructor () {
    this.callbacks = []
  }

  /**
   * Register a callback to be called when a request starts
   * @param {Function} callback - Function to call with request context
   */
  onStart (callback) {
    if (typeof callback !== 'function') {
      throw new Error('RequestTracker onStart callback must be a function')
    }
    this.callbacks.push(callback)
  }

  /**
   * Notify all registered callbacks about a request start
   * @param {Object} context - Request start context
   * @returns {Object} Combined result with onRequestEnd callbacks
   */
  start (context) {
    const results = this.callbacks
      .map(callback => {
        try {
          return callback(context)
        } catch (error) {
          // Isolate plugin errors - don't let one plugin break others
          console.error('RequestTracker callback error:', error)
          return null
        }
      })
      .filter(result => result && typeof result === 'object')

    return {
      onRequestEnd: (endContext) => {
        results.forEach(result => {
          if (typeof result.onRequestEnd === 'function') {
            try {
              result.onRequestEnd(endContext)
            } catch (error) {
              console.error('RequestTracker onRequestEnd callback error:', error)
            }
          }
        })
      },
      extraRequestHeaders: results
        .map(result => result.extraRequestHeaders)
        .filter(headers => headers && typeof headers === 'object')
        .reduce((combined, headers) => Object.assign(combined, headers), {})
    }
  }

  /**
   * Reset tracker (for testing)
   */
  _reset () {
    this.callbacks = []
  }
}

module.exports = RequestTracker
