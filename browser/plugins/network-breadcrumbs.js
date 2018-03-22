/* global XMLHttpRequest, XDomainRequest */
const patch = require('../../base/lib/patch')
const breadcrumbType = 'network'
let restoreFunctions = []
let client

/*
 * Leaves breadcrumbs when network requests occur
 */
module.exports = {
  init: (_client) => {
    client = _client
    monkeyPatchXMLHttpRequest()
    monkeyPatchXDomainRequest()
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

// ------------------------------------------------------------------------------------------------
// XMLHttpRequest and XDomainRequest monkey patch
// ------------------------------------------------------------------------------------------------
// create keys to safely store metadata on the request object
const setupKey = 'BUGSNAG:SETUP'
const requestUrlKey = 'BUGSNAG:REQUEST_URL'
const requestMethodKey = 'BUGSNAG:REQUEST_METHOD'

function monkeyPatchXMLHttpRequest () {
  monkeyPatchXish(XMLHttpRequest)
}

function monkeyPatchXDomainRequest () {
  if (!('XDomainRequest' in window)) return
  monkeyPatchXish(XDomainRequest)
}

// generic function for monkey patching both XMLHttpRequest and XDomainRequest
function monkeyPatchXish (NetworkApi) {
  // NetworkApi can be either XMLHttpRequest or XDomainRequest

  // override native open()
  let nativeOpen = NetworkApi.prototype.open
  NetworkApi.prototype.open = function open (method, url) {
    if (url === client.notifier.url) {
      // don't leave a network breadcrumb from bugsnag notify calls
      nativeOpen.apply(this, arguments)
      return
    }
    // store url and HTTP method for later
    this[requestUrlKey] = url
    this[requestMethodKey] = method
    // if we haven't setup listeners already, set them up now
    if (!this[setupKey]) {
      const onLoad = handleXIshLoad(NetworkApi.prototype.constructor.name)
      const onError = handleXIshError(NetworkApi.prototype.constructor.name)
      if ('addEventListener' in this) {
        // attach load event listener
        this.addEventListener('load', onLoad)
        // attach error event listener
        this.addEventListener('error', onError)
      } else {
        patch(this, 'onload', onLoad)
        patch(this, 'onerror', onError)
      }

      this[setupKey] = true
    }

    nativeOpen.apply(this, arguments)
  }

  restoreFunctions.push(() => {
    NetworkApi.prototype.open = nativeOpen
  })
}

// generic function for handling "load" event from XMLHttpRequest and XDomainRequest
// @param name - "XMLHttpRequest" | "XDomainRequest"
const handleXIshLoad = name => function onLoad () {
  const metaData = {
    status: this.status,
    request: `${this[requestMethodKey]} ${this[requestUrlKey]}`
  }
  if (this.status >= 400) {
    // contacted server but got an error response
    client.leaveBreadcrumb(`${name} failed`, metaData, breadcrumbType)
  } else {
    client.leaveBreadcrumb(`${name} succeeded`, metaData, breadcrumbType)
  }
}

// generic function for handling "error" event from XMLHttpRequest and XDomainRequest
// @param name - "XMLHttpRequest" | "XDomainRequest"
const handleXIshError = name => function onError () {
  // failed to contact server
  client.leaveBreadcrumb(`${name} error`, {
    request: `${this[requestMethodKey]} ${this[requestUrlKey]}`
  }, breadcrumbType)
}

// ------------------------------------------------------------------------------------------------
// window.fetch monkey patch
// ------------------------------------------------------------------------------------------------
function monkeyPatchFetch () {
  if (!('fetch' in window)) return

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
