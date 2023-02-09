const BREADCRUMB_TYPE = 'request'

const includes = require('@bugsnag/core/lib/es-utils/includes')

/*
 * Leaves breadcrumbs when network requests occur
 */
module.exports = (_ignoredUrls = [], win = window) => {
  let restoreFunctions = []
  const plugin = {
    load: client => {
      if (!client._isBreadcrumbTypeEnabled('request')) return

      const ignoredUrls = [
        client._config.endpoints.notify,
        client._config.endpoints.sessions
      ].concat(_ignoredUrls)

      monkeyPatchXMLHttpRequest()
      monkeyPatchFetch()

      // XMLHttpRequest monkey patch
      function monkeyPatchXMLHttpRequest () {
        if (!('addEventListener' in win.XMLHttpRequest.prototype)) return
        const nativeOpen = win.XMLHttpRequest.prototype.open

        // override native open()
        win.XMLHttpRequest.prototype.open = function open (method, url) {
          let requestSetupKey = false

          const error = () => handleXHRError(method, url, getDuration(requestStart), requestContentLength)
          const load = () => handleXHRLoad(method, url, this.status, getDuration(requestStart), requestContentLength)

          // if we have already setup listeners, it means open() was called twice, we need to remove
          // the listeners and recreate them
          if (requestSetupKey) {
            this.removeEventListener('load', load)
            this.removeEventListener('error', error)
          }

          // attach load event listener
          this.addEventListener('load', load)
          // attach error event listener
          this.addEventListener('error', error)

          requestSetupKey = true

          const oldSend = this.send
          let requestStart
          let requestContentLength

          // override send() for this XMLHttpRequest instance
          this.send = function send (body) {
            requestContentLength = getByteLength(body)
            requestStart = new Date()
            oldSend.apply(this, arguments)
          }

          nativeOpen.apply(this, arguments)
        }

        if (process.env.NODE_ENV !== 'production') {
          restoreFunctions.push(() => {
            win.XMLHttpRequest.prototype.open = nativeOpen
          })
        }
      }

      function handleXHRLoad (method, url, status, duration, requestContentLength) {
        if (url === undefined) {
          client._logger.warn('The request URL is no longer present on this XMLHttpRequest. A breadcrumb cannot be left for this request.')
          return
        }

        // an XMLHttpRequest's URL can be an object as long as its 'toString'
        // returns a URL, e.g. a HTMLAnchorElement
        if (typeof url === 'string' && includes(ignoredUrls, url.replace(/\?.*$/, ''))) {
          // don't leave a network breadcrumb from bugsnag notify calls
          return
        }
        const metadata = {
          status: status,
          request: `${method} ${url}`,
          duration: duration,
          requestContentLength: requestContentLength
        }
        if (status >= 400) {
          // contacted server but got an error response
          client.leaveBreadcrumb('XMLHttpRequest failed', metadata, BREADCRUMB_TYPE)
        } else {
          client.leaveBreadcrumb('XMLHttpRequest succeeded', metadata, BREADCRUMB_TYPE)
        }
      }

      function handleXHRError (method, url, duration, requestContentLength) {
        if (url === undefined) {
          client._logger.warn('The request URL is no longer present on this XMLHttpRequest. A breadcrumb cannot be left for this request.')
          return
        }

        if (typeof url === 'string' && includes(ignoredUrls, url.replace(/\?.*$/, ''))) {
          // don't leave a network breadcrumb from bugsnag notify calls
          return
        }

        // failed to contact server
        client.leaveBreadcrumb('XMLHttpRequest error', {
          request: `${method} ${url}`,
          duration: duration,
          requestContentLength: requestContentLength
        }, BREADCRUMB_TYPE)
      }

      // window.fetch monkey patch
      function monkeyPatchFetch () {
        // only patch it if it exists and if it is not a polyfill (patching a polyfilled
        // fetch() results in duplicate breadcrumbs for the same request because the
        // implementation uses XMLHttpRequest which is also patched)
        if (!('fetch' in win) || win.fetch.polyfill) return

        const oldFetch = win.fetch
        win.fetch = function fetch () {
          const urlOrRequest = arguments[0]
          const options = arguments[1]

          let method
          let url = null
          let requestContentLength

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

          if (options && 'body' in options) {
            requestContentLength = getByteLength(options.body)
          }

          return new Promise((resolve, reject) => {
            const requestStart = new Date()

            // pass through to native fetch
            oldFetch(...arguments)
              .then(response => {
                handleFetchSuccess(response, method, url, getDuration(requestStart), requestContentLength)
                resolve(response)
              })
              .catch(error => {
                handleFetchError(method, url, getDuration(requestStart), requestContentLength)
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

      const handleFetchSuccess = (response, method, url, duration, requestContentLength) => {
        const metadata = {
          status: response.status,
          request: `${method} ${url}`,
          duration: duration,
          requestContentLength: requestContentLength
        }
        if (response.status >= 400) {
          // when the request comes back with a 4xx or 5xx status it does not reject the fetch promise,
          client.leaveBreadcrumb('fetch() failed', metadata, BREADCRUMB_TYPE)
        } else {
          client.leaveBreadcrumb('fetch() succeeded', metadata, BREADCRUMB_TYPE)
        }
      }

      const handleFetchError = (method, url, duration, requestContentLength) => {
        client.leaveBreadcrumb('fetch() error', {
          request: `${method} ${url}`,
          duration: duration,
          requestContentLength: requestContentLength
        }, BREADCRUMB_TYPE)
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    plugin.destroy = () => {
      restoreFunctions.forEach(fn => fn())
      restoreFunctions = []
    }
  }

  const getByteLength = (body) => {
    // body could be any of the types listed here: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#parameters
    // Omit content length metadata if body is an unsupported type
    if ((body === null || typeof body === 'undefined') ||
      (win.ReadableStream && body instanceof win.ReadableStream) ||
      (win.FormData && body instanceof win.FormData) ||
      (win.Document && body instanceof win.Document)) return undefined

    // See if we can get the byte length directly
    if (typeof body.byteLength === 'number') {
      // ArrayBuffer, DataView, TypedArray
      return body.byteLength
    } else if (win.Blob && body instanceof win.Blob) {
      return body.size
    } else if (!win.Blob) {
      return undefined
    }

    // Stringify the input and construct a Blob to get the utf-8 encoded byte length
    // This may fail if the input object has no prototype or a broken toString
    try {
      const stringified = String(body)
      return new win.Blob([stringified]).size
    } catch (e) {
      return undefined
    }
  }

  return plugin
}

const getDuration = (startTime) => startTime && new Date() - startTime
