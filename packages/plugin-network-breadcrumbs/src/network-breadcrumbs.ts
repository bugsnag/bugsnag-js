import { Client, Config, Logger, Plugin } from '@bugsnag/core'
import includes from '@bugsnag/core/lib/es-utils/includes'

const BREADCRUMB_TYPE = 'request'

interface InternalClient extends Client {
  _logger: Logger
  _config: Required<Config>
  _isBreadcrumbTypeEnabled: (type: string) => boolean
}

type FetchArguments = Parameters<Window['fetch']>

/*
 * Leaves breadcrumbs when network requests occur
 */
export default (_ignoredUrls = [], win = window): Plugin => {
  let restoreFunctions: Array<() => void> = []
  const plugin: Plugin = {
    load: client => {
      const internalClient = client as InternalClient

      if (!internalClient._isBreadcrumbTypeEnabled('request')) return

      const ignoredUrls = [
        internalClient._config.endpoints.notify,
        internalClient._config.endpoints.sessions
      ].concat(_ignoredUrls)

      monkeyPatchXMLHttpRequest()
      monkeyPatchFetch()

      // XMLHttpRequest monkey patch
      function monkeyPatchXMLHttpRequest () {
        if (!('addEventListener' in win.XMLHttpRequest.prototype) || !('WeakMap' in win)) return

        const trackedRequests = new WeakMap()
        const requestHandlers = new WeakMap()

        const originalOpen = win.XMLHttpRequest.prototype.open
        win.XMLHttpRequest.prototype.open = function open (method: string, url: string | URL) {
          // it's possible for `this` to be `undefined`, which is not a valid key for a WeakMap
          if (this) {
            trackedRequests.set(this, { method, url })
          }
          originalOpen.apply(this, arguments as unknown as Parameters<typeof originalOpen>)
        }

        const originalSend = win.XMLHttpRequest.prototype.send
        win.XMLHttpRequest.prototype.send = function send (body) {
          const requestData = trackedRequests.get(this)
          if (requestData) {
          // if we have already setup listeners then this request instance is being reused,
          // so we need to remove the listeners from the previous send
            const listeners = requestHandlers.get(this)
            if (listeners) {
              this.removeEventListener('load', listeners.load)
              this.removeEventListener('error', listeners.error)
            }

            const requestStart = new Date()
            const error = () => handleXHRError(requestData.method, requestData.url, getDuration(requestStart))
            const load = () => handleXHRLoad(requestData.method, requestData.url, this.status, getDuration(requestStart))

            this.addEventListener('load', load)
            this.addEventListener('error', error)
            // it's possible for `this` to be `undefined`, which is not a valid key for a WeakMap
            if (this) {
              requestHandlers.set(this, { load, error })
            }
          }

          originalSend.apply(this, arguments as unknown as Parameters<typeof originalSend>)
        }

        if (process.env.NODE_ENV !== 'production') {
          restoreFunctions.push(() => {
            win.XMLHttpRequest.prototype.open = originalOpen
            win.XMLHttpRequest.prototype.send = originalSend
          })
        }
      }

      function handleXHRLoad (method: string, url: string, status: number, duration: number) {
        if (url === undefined) {
          internalClient._logger.warn('The request URL is no longer present on this XMLHttpRequest. A breadcrumb cannot be left for this request.')
          return
        }

        // an XMLHttpRequest's URL can be an object as long as its 'toString'
        // returns a URL, e.g. a HTMLAnchorElement
        if (typeof url === 'string' && includes(ignoredUrls, url.replace(/\?.*$/, ''))) {
          // don't leave a network breadcrumb from bugsnag notify calls
          return
        }
        const metadata = {
          status,
          method: String(method),
          url: String(url),
          duration: duration
        }
        if (status >= 400) {
          // contacted server but got an error response
          internalClient.leaveBreadcrumb('XMLHttpRequest failed', metadata, BREADCRUMB_TYPE)
        } else {
          internalClient.leaveBreadcrumb('XMLHttpRequest succeeded', metadata, BREADCRUMB_TYPE)
        }
      }

      function handleXHRError (method: string, url: string, duration: number) {
        if (url === undefined) {
          internalClient._logger.warn('The request URL is no longer present on this XMLHttpRequest. A breadcrumb cannot be left for this request.')
          return
        }

        if (typeof url === 'string' && includes(ignoredUrls, url.replace(/\?.*$/, ''))) {
          // don't leave a network breadcrumb from bugsnag notify calls
          return
        }

        // failed to contact server
        internalClient.leaveBreadcrumb('XMLHttpRequest error', {
          method: String(method),
          url: String(url),
          duration: duration
        }, BREADCRUMB_TYPE)
      }

      // window.fetch monkey patch
      function monkeyPatchFetch () {
        // only patch it if it exists and if it is not a polyfill (patching a polyfilled
        // fetch() results in duplicate breadcrumbs for the same request because the
        // implementation uses XMLHttpRequest which is also patched)
        // @ts-expect-error polyfill is not defined in the Fetch API
        if (!('fetch' in win) || win.fetch.polyfill) return

        const oldFetch = win.fetch
        win.fetch = function fetch (...args: FetchArguments) {
          const urlOrRequest = args[0]
          const options = args[1]

          let method: string | undefined
          let url: string | URL | null = null

          if (urlOrRequest && typeof urlOrRequest === 'object' && 'url' in urlOrRequest) {
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

          return new Promise((resolve, reject) => {
            const requestStart = new Date()

            // pass through to native fetch
            oldFetch(...args)
              .then(response => {
                handleFetchSuccess(response, method, url, getDuration(requestStart))
                resolve(response)
              })
              .catch(error => {
                handleFetchError(String(method), String(url), getDuration(requestStart))
                reject(error)
              })
          })
        }

        if (process.env.NODE_ENV !== 'production') {
          restoreFunctions.push(() => {
            win.fetch = oldFetch
          })
        }
      }

      const handleFetchSuccess = (response: Response, method: string | undefined, url: string | URL | null, duration: number) => {
        const metadata = {
          method: String(method),
          status: response.status,
          url: String(url),
          duration: duration
        }
        if (response.status >= 400) {
          // when the request comes back with a 4xx or 5xx status it does not reject the fetch promise,
          internalClient.leaveBreadcrumb('fetch() failed', metadata, BREADCRUMB_TYPE)
        } else {
          internalClient.leaveBreadcrumb('fetch() succeeded', metadata, BREADCRUMB_TYPE)
        }
      }

      const handleFetchError = (method: string, url: string, duration: number) => {
        internalClient.leaveBreadcrumb('fetch() error', { method: String(method), url: String(url), duration: duration }, BREADCRUMB_TYPE)
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

const getDuration = (startTime: Date): number => startTime && Number(new Date()) - Number(startTime)
