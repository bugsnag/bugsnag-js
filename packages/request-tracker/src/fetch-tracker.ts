import headersToObject from './headers-to-object'
import RequestTracker from './request-tracker'

interface FetchTrackerGlobal {
  fetch: typeof fetch & { polyfill?: boolean }
  __bugsnag_fetch_tracker__?: RequestTracker
}

export default function createFetchTracker (global: FetchTrackerGlobal) {
  if (!('fetch' in global) || global.fetch.polyfill) return

  if (!global.__bugsnag_fetch_tracker__) {
    const tracker = new RequestTracker()
    const originalFetch = global.fetch

    global.fetch = function wrappedFetch (this: typeof globalThis, urlOrRequest: RequestInfo | URL, options: RequestInit = {}) {
      let url: string | null = null
      let method = 'GET'

      if (urlOrRequest && typeof urlOrRequest === 'object') {
        url = (urlOrRequest as Request).url
        if (options && 'method' in options) {
          method = options.method as string
        } else if (urlOrRequest && 'method' in urlOrRequest) {
          method = (urlOrRequest as Request).method
        }
      } else {
        url = urlOrRequest as string
        if (options && 'method' in options) {
          method = options.method as string
        }
      }

      if (method === undefined) {
        method = 'GET'
      }

      let requestHeaders: Record<string, string> = {}
      if (options && options.headers) {
        if (options.headers instanceof Headers) {
          requestHeaders = headersToObject(options.headers)
        } else if (typeof options.headers === 'object') {
          requestHeaders = options.headers as Record<string, string>
        }
      }

      const startTime = Date.now()
      const context = {
        url: String(url),
        method: String(method),
        startTime,
        type: 'fetch' as const,
        input: urlOrRequest,
        headers: requestHeaders,
        body: options ? options.body : undefined
      }

      const { onRequestEnd } = tracker.start(context)

      return originalFetch.call(this, ...arguments as unknown as Parameters<typeof originalFetch>).then(
        (response: Response) => {
          onRequestEnd({
            endTime: Date.now(),
            status: response.status,
            state: 'success',
            headers: headersToObject(response.headers)
          })
          return response
        },
        (error: unknown) => {
          onRequestEnd({
            endTime: Date.now(),
            state: 'error',
            error
          })
          throw error
        }
      )
    } as typeof fetch
    global.__bugsnag_fetch_tracker__ = tracker

    if (process.env.NODE_ENV !== 'production') {
      tracker._restore = () => {
        global.fetch = originalFetch
        delete global.__bugsnag_fetch_tracker__
      }
    }
  }

  return global.__bugsnag_fetch_tracker__
}
