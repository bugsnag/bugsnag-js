const BREADCRUMB_TYPE = 'request'

// keys to safely store metadata on the request object
const REQUEST_SETUP_KEY = 'BS~~S'
const REQUEST_URL_KEY = 'BS~~U'
const REQUEST_METHOD_KEY = 'BS~~M'

const { includes } = require('@bugsnag/core/lib/es-utils')

let restoreFunctions = []
let client
let win
let getIgnoredUrls

const defaultIgnoredUrls = () => [
  client.config.endpoints.notify,
  client.config.endpoints.sessions
]

/*
 * Leaves breadcrumbs when network requests occur
 */
exports.name = 'networkBreadcrumbs'
exports.init = (_client, _getIgnoredUrls = defaultIgnoredUrls, _win = window) => {
  const explicitlyDisabled = _client.config.networkBreadcrumbsEnabled === false
  const implicitlyDisabled = _client.config.autoBreadcrumbs === false && _client.config.networkBreadcrumbsEnabled !== true
  if (explicitlyDisabled || implicitlyDisabled) return

  client = _client
  win = _win
  getIgnoredUrls = _getIgnoredUrls
  monkeyPatchXMLHttpRequest()
  monkeyPatchFetch()
}

exports.configSchema = {
  networkBreadcrumbsEnabled: {
    defaultValue: () => undefined,
    validate: (value) => value === true || value === false || value === undefined,
    message: 'should be true|false'
  }
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = () => {
    restoreFunctions.forEach(fn => fn())
    restoreFunctions = []
  }
}

// XMLHttpRequest monkey patch
const monkeyPatchXMLHttpRequest = () => {
  if (!('addEventListener' in win.XMLHttpRequest.prototype)) return
  const nativeOpen = win.XMLHttpRequest.prototype.open

  // override native open()
  win.XMLHttpRequest.prototype.open = function open (method, url) {
    // store url and HTTP method for later
    this[REQUEST_URL_KEY] = url
    this[REQUEST_METHOD_KEY] = method

    // if we have already setup listeners, it means open() was called twice, we need to remove
    // the listeners and recreate them
    if (this[REQUEST_SETUP_KEY]) {
      this.removeEventListener('load', handleXHRLoad)
      this.removeEventListener('error', handleXHRError)
    }

    // attach load event listener
    this.addEventListener('load', handleXHRLoad)
    // attach error event listener
    this.addEventListener('error', handleXHRError)

    this[REQUEST_SETUP_KEY] = true

    nativeOpen.apply(this, arguments)
  }

  if (process.env.NODE_ENV !== 'production') {
    restoreFunctions.push(() => {
      win.XMLHttpRequest.prototype.open = nativeOpen
    })
  }
}

function handleXHRLoad () {
  if (includes(getIgnoredUrls(), this[REQUEST_URL_KEY])) {
    // don't leave a network breadcrumb from bugsnag notify calls
    return
  }
  const metaData = {
    status: this.status,
    request: `${this[REQUEST_METHOD_KEY]} ${this[REQUEST_URL_KEY]}`
  }
  if (this.status >= 400) {
    // contacted server but got an error response
    client.leaveBreadcrumb('XMLHttpRequest failed', metaData, BREADCRUMB_TYPE)
  } else {
    client.leaveBreadcrumb('XMLHttpRequest succeeded', metaData, BREADCRUMB_TYPE)
  }
}

function handleXHRError () {
  if (includes(getIgnoredUrls, this[REQUEST_URL_KEY])) {
    // don't leave a network breadcrumb from bugsnag notify calls
    return
  }
  // failed to contact server
  client.leaveBreadcrumb('XMLHttpRequest error', {
    request: `${this[REQUEST_METHOD_KEY]} ${this[REQUEST_URL_KEY]}`
  }, BREADCRUMB_TYPE)
}

// window.fetch monkey patch
const monkeyPatchFetch = () => {
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

    return new Promise((resolve, reject) => {
      // pass through to native fetch
      oldFetch(...arguments)
        .then(response => {
          handleFetchSuccess(response, method, url)
          resolve(response)
        })
        .catch(error => {
          handleFetchError(method, url)
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

const handleFetchSuccess = (response, method, url) => {
  const metaData = {
    status: response.status,
    request: `${method} ${url}`
  }
  if (response.status >= 400) {
    // when the request comes back with a 4xx or 5xx status it does not reject the fetch promise,
    client.leaveBreadcrumb('fetch() failed', metaData, BREADCRUMB_TYPE)
  } else {
    client.leaveBreadcrumb('fetch() succeeded', metaData, BREADCRUMB_TYPE)
  }
}

const handleFetchError = (method, url) => {
  client.leaveBreadcrumb('fetch() error', { request: `${method} ${url}` }, BREADCRUMB_TYPE)
}
