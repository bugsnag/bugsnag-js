const RequestTracker = require('./request-tracker')

/**
 * Create XHR request tracker with singleton pattern
 * @param {Object} global - Global object (window or global)
 * @param {Object} options - Configuration options
 * @returns {Object} Tracker instance
 */
function createXhrTracker (global, options = {}) {
  if (!('addEventListener' in global.XMLHttpRequest.prototype) || !('WeakMap' in global)) return

  // Use singleton pattern - one tracker per global context
  if (!global.__bugsnag_xhr_tracker__) {
    const tracker = new RequestTracker()

    const trackedRequests = new WeakMap()
    const requestHandlers = new WeakMap()

    const originalOpen = global.XMLHttpRequest.prototype.open
    const originalSend = global.XMLHttpRequest.prototype.send

    global.XMLHttpRequest.prototype.open = function open (method, url) {
      // it's possible for `this` to be `undefined`, which is not a valid key for a WeakMap
      if (this) {
        trackedRequests.set(this, { method: String(method), url: String(url) })
      }
      originalOpen.apply(this, arguments)
    }

    global.XMLHttpRequest.prototype.send = function send (body) {
      const requestData = trackedRequests.get(this)
      if (requestData) {
        // if we have already setup listeners then this request instance is being reused,
        // so we need to remove the listeners from the previous send
        const listeners = requestHandlers.get(this)
        if (listeners) {
          this.removeEventListener('load', listeners.load)
          this.removeEventListener('error', listeners.error)
        }

        const startTime = Date.now()
        const context = {
          url: requestData.url,
          method: requestData.method,
          startTime,
          type: 'xmlhttprequest',
          body,
          xhr: this
        }

        const { onRequestEnd } = tracker.start(context)

        const handleLoad = () => {
          onRequestEnd({
            endTime: Date.now(),
            status: this.status,
            state: 'success',
            xhr: this
          })
        }

        const handleError = () => {
          onRequestEnd({
            endTime: Date.now(),
            state: 'error',
            xhr: this
          })
        }

        this.addEventListener('load', handleLoad)
        this.addEventListener('error', handleError)

        // it's possible for `this` to be `undefined`, which is not a valid key for a WeakMap
        if (this) {
          requestHandlers.set(this, { load: handleLoad, error: handleError })
        }
      }

      originalSend.apply(this, arguments)
    }

    // Store tracker and mark as active
    global.__bugsnag_xhr_tracker__ = tracker

    // Restore function for development
    if (process.env.NODE_ENV !== 'production') {
      tracker._restore = () => {
        global.XMLHttpRequest.prototype.open = originalOpen
        global.XMLHttpRequest.prototype.send = originalSend
        delete global.__bugsnag_xhr_tracker__
      }
    }
  }

  return global.__bugsnag_xhr_tracker__
}

module.exports = createXhrTracker
