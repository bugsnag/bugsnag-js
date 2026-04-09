import RequestTracker from './request-tracker'
import xhrHeaderStringToObject from './xhr-header-string-to-object'
import xhrResponseParser from './xhr-response-parser'

interface TrackedRequestData {
  method: string
  url: string
  headers?: Record<string, string>
}

interface RequestHandlers {
  load: () => void
  error: () => void
}

interface XhrTrackerGlobal {
  XMLHttpRequest: typeof XMLHttpRequest
  WeakMap: typeof WeakMap
  __bugsnag_xhr_tracker__?: RequestTracker
}

export default function createXhrTracker (global: XhrTrackerGlobal) {
  if (!('addEventListener' in global.XMLHttpRequest.prototype) || !('WeakMap' in global)) return

  if (!global.__bugsnag_xhr_tracker__) {
    const tracker = new RequestTracker()

    const trackedRequests = new WeakMap<XMLHttpRequest, TrackedRequestData>()
    const requestHandlers = new WeakMap<XMLHttpRequest, RequestHandlers>()

    const originalOpen = global.XMLHttpRequest.prototype.open
    const originalSend = global.XMLHttpRequest.prototype.send
    const originalSetRequestHeader = global.XMLHttpRequest.prototype.setRequestHeader

    global.XMLHttpRequest.prototype.open = function open (method: string, url: string | URL) {
      if (this) {
        trackedRequests.set(this, { method: String(method), url: String(url) })
      }
      originalOpen.apply(this, arguments as unknown as Parameters<typeof originalOpen>)
    }

    global.XMLHttpRequest.prototype.setRequestHeader = function setRequestHeader (header: string, value: string) {
      if (this) {
        const requestData = trackedRequests.get(this)
        if (requestData) {
          requestData.headers = requestData.headers || {}
          requestData.headers[String(header)] = (requestData.headers[String(header)] || '') + String(value)
        }
      }
      originalSetRequestHeader.apply(this, arguments as unknown as Parameters<typeof originalSetRequestHeader>)
    }

    global.XMLHttpRequest.prototype.send = function send (body?: Document | XMLHttpRequestBodyInit | null) {
      const requestData = trackedRequests.get(this)
      if (requestData) {
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
          type: 'xmlhttprequest' as const,
          body,
          headers: requestData.headers
        }

        const { onRequestEnd } = tracker.start(context)

        const getResponseHeaders = () => xhrHeaderStringToObject(this.getAllResponseHeaders())

        const handleLoad = () => {
          onRequestEnd({
            endTime: Date.now(),
            status: this.status,
            state: 'success',
            headers: getResponseHeaders(),
            body: xhrResponseParser(this)
          })
        }

        const handleError = () => {
          onRequestEnd({
            endTime: Date.now(),
            state: 'error',
            headers: getResponseHeaders(),
            body: xhrResponseParser(this)
          })
        }

        this.addEventListener('load', handleLoad)
        this.addEventListener('error', handleError)

        if (this) {
          requestHandlers.set(this, { load: handleLoad, error: handleError })
        }
      }

      originalSend.apply(this, arguments as unknown as Parameters<typeof originalSend>)
    }

    global.__bugsnag_xhr_tracker__ = tracker

    if (process.env.NODE_ENV !== 'production') {
      tracker._restore = () => {
        global.XMLHttpRequest.prototype.open = originalOpen
        global.XMLHttpRequest.prototype.send = originalSend
        global.XMLHttpRequest.prototype.setRequestHeader = originalSetRequestHeader
        delete global.__bugsnag_xhr_tracker__
      }
    }
  }

  return global.__bugsnag_xhr_tracker__
}
