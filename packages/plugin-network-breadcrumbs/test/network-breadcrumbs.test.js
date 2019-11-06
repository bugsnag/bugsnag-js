const { describe, it, expect, jasmine, afterEach } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

// mock XMLHttpRequest
function XMLHttpRequest () {
  this._listeners = { load: () => {}, error: () => {} }
  this.status = null
}
XMLHttpRequest.prototype.open = function (method, url) {
}
XMLHttpRequest.prototype.send = function (fail, status) {
  if (fail) {
    this._listeners.error.call(this)
  } else {
    this.status = status
    this._listeners.load.call(this)
  }
}
XMLHttpRequest.prototype.addEventListener = function (evt, listener) {
  this._listeners[evt] = listener
}
XMLHttpRequest.prototype.removeEventListener = function (evt, listener) {
  if (listener === this._listeners[evt]) delete this._listeners[evt]
}

function fetch (url, options, fail, status) {
  return new Promise((resolve, reject) => {
    if (fail) {
      reject(new Error('Fail'))
    } else {
      resolve({ status })
    }
  })
}

describe('plugin: network breadcrumbs', () => {
  afterEach(() => {
    // undo the global side effects
    plugin.destroy()
  })

  it('should leave a breadcrumb when an XMLHTTPRequest resolves', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    // tell the mock request to succeed with status code 200
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(jasmine.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest succeeded',
      metadata: {
        status: 200,
        request: 'GET /'
      }
    }))
  })

  it('should not leave duplicate breadcrumbs if open() is called twice', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, undefined, window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    request.open('GET', '/')
    request.send(false, 200)
    expect(client._breadcrumbs.length).toBe(1)
  })

  it('should leave a breadcrumb when an XMLHTTPRequest has a failed response', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/this-does-not-exist')
    request.send(false, 404)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(jasmine.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest failed',
      metadata: {
        status: 404,
        request: 'GET /this-does-not-exist'
      }
    }))
  })

  it('should leave a breadcrumb when an XMLHTTPRequest has a network error', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()

    request.open('GET', 'https://another-domain.xyz/')
    request.send(true)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(jasmine.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest error',
      metadata: {
        request: 'GET https://another-domain.xyz/'
      }
    }))
  })

  it('should not leave a breadcrumb for request to bugsnag notify endpoint', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, undefined, window)

    const request = new window.XMLHttpRequest()
    request.open('GET', client._config.endpoints.notify)
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(0)
  })

  it('should not leave a breadcrumb for session tracking requests', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, undefined, window)

    const request = new window.XMLHttpRequest()
    request.open('GET', client._config.endpoints.sessions)
    request.send(false, 200)
    expect(client._breadcrumbs.length).toBe(0)
  })

  it('should leave a breadcrumb when a fetch() resolves', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    window.fetch('/', {}, false, 200).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        message: 'fetch() succeeded',
        metadata: {
          status: 200,
          request: 'GET /'
        }
      }))
      done()
    })
  })

  it('should leave a breadcrumb when a fetch() has a failed response', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    window.fetch('/does-not-exist', {}, false, 404).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        message: 'fetch() failed',
        metadata: {
          status: 404,
          request: 'GET /does-not-exist'
        }
      }))
      done()
    })
  })

  it('should leave a breadcrumb when a fetch() has a network error', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    window.fetch('https://another-domain.xyz/foo/bar', {}, true).catch(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        message: 'fetch() error',
        metadata: {
          request: 'GET https://another-domain.xyz/foo/bar'
        }
      }))
      done()
    })
  })

  it('should not be enabled when enabledBreadcrumbTypes=null', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(0)
  })

  it('should be enabled when enabledBreadcrumbTypes=["request"]', () => {
    const window = { XMLHttpRequest }

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['request'] }, undefined, VALID_NOTIFIER)
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(1)
  })
})
