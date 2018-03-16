const { XMLHttpRequest } = window
const breadcrumbType = 'network'
let restoreFunctions = []
let client

/*
 * Leaves breadcrumbs when console log methods are called
 */
module.exports = {
  init: (_client) => {
    client = _client
    monkeyPatchXHR()
    monkeyPatchFetch()
  },
  destroy: () => {
    restoreFunctions.forEach(restore => restore())
    restoreFunctions = []
  },
  configSchema: {
    networkBreadcrumbsEnabled: {
      defaultValue: () => undefined,
      validate: (value) => value === true || value === false || value === undefined,
      message: '(boolean) networkBreadcrumbsEnabled should be true or false'
    }
  }
}

// ---------------------------
// XMLHttpRequest monkey patch
// ---------------------------
// create keys to safely store metadata on the request object
const setupKey = 'BUGSNAG:SETUP'
const requestUrlKey = 'BUGSNAG:REQUEST_URL'
const requestMethodKey = 'BUGSNAG:REQUEST_METHOD'
function monkeyPatchXHR () {
  // copy native request method so we can monkey patch it
  const nativeOpen = XMLHttpRequest.prototype.open
  // override native open()
  XMLHttpRequest.prototype.open = function (method, url) {
    // store url and HTTP method for later
    this[requestUrlKey] = url
    this[requestMethodKey] = method
    // if we haven't setup listeners already, set them up now
    if (!this[setupKey]) {
      // attach load event listener
      this.addEventListener('load', handleXHRLoad)

      // attach error event listener
      this.addEventListener('error', handleXHRError)

      this[setupKey] = true
    }

    // call the  native open()
    nativeOpen.apply(this, arguments)
  }

  restoreFunctions.push(() => {
    XMLHttpRequest.prototype.open = nativeOpen
  })
}

function handleXHRLoad () {
  const metaData = {
    status: this.status,
    request: `${this[requestMethodKey]} ${this[requestUrlKey]}`
  }
  if (this.status >= 400) {
    // contacted server but got an error response
    client.leaveBreadcrumb('XMLHttpRequest failed', metaData, breadcrumbType)
  } else {
    client.leaveBreadcrumb('XMLHttpRequest succeeded', metaData, breadcrumbType)
  }
}

function handleXHRError () {
  // failed to contact server
  client.leaveBreadcrumb('XMLHttpRequest error', {
    request: `${this[requestMethodKey]} ${this[requestUrlKey]}`
  }, breadcrumbType)
}

// ---------------------------
// window.fetch monkey patch
// ---------------------------
function monkeyPatchFetch () {
  if (!window || !window.fetch) {
    return
  }

  let oldFetch = window.fetch
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

  restoreFunctions.push(() => {
    window.fetch = oldFetch
  })
}

function handleFetchSuccess (response, method, url) {
  let metaData = {
    status: response.status,
    request: `${method} ${url}`
  }
  if (response.status >= 400) {
    // when the request comes back with a 4xx or 5xx status it does not reject the fetch promise,
    client.leaveBreadcrumb('fetch() failed', metaData, breadcrumbType)
  } else {
    client.leaveBreadcrumb('fetch() succeeded', metaData, breadcrumbType)
  }
}

function handleFetchError (method, url) {
  client.leaveBreadcrumb('fetch() error', { request: `${method} ${url}` }, breadcrumbType)
}
