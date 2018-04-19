const BREADCRUMB_TYPE = 'network'

// keys to safely store metadata on the request object
const REQUEST_SETUP_KEY = 'BUGSNAG:SETUP'
const REQUEST_URL_KEY = 'BUGSNAG:REQUEST_URL'
const REQUEST_METHOD_KEY = 'BUGSNAG:REQUEST_METHOD'

let restoreFunctions = []
let client

/*
 * Leaves breadcrumbs when network requests occur
 */
exports.init = (_client) => {
  client = _client
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
  if (!('addEventListener' in window.XMLHttpRequest.prototype)) return
  const nativeOpen = window.XMLHttpRequest.prototype.open

  // override native open()
  window.XMLHttpRequest.prototype.open = function open (method, url) {
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
      window.XMLHttpRequest.prototype.open = nativeOpen
    })
  }
}

function handleXHRLoad () {
  if (
    this[REQUEST_URL_KEY] === client.config.endpoint ||
    this[REQUEST_URL_KEY] === client.config.sessionEndpoint
  ) {
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
  if (
    this[REQUEST_URL_KEY] === client.config.endpoint ||
    this[REQUEST_URL_KEY] === client.config.sessionEndpoint
  ) {
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
  if (!('fetch' in window)) return

  const oldFetch = window.fetch
  window.fetch = function fetch (...args) {
    let [url, options] = args
    let method = 'GET'
    if (options && options.method) {
      method = options.method
    }
    return new Promise((resolve, reject) => {
      // pass through to native fetch
      oldFetch(...args)
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
      window.fetch = oldFetch
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
