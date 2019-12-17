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
    this._listeners['error'].call(this)
  } else {
    this.status = status
    this._listeners['load'].call(this)
  }
}
XMLHttpRequest.prototype.addEventListener = function (evt, listener) {
  this._listeners[evt] = listener
}
XMLHttpRequest.prototype.removeEventListener = function (evt, listener) {
  if (listener === this._listeners[evt]) delete this._listeners[evt]
}

// mock fetch
function fetch (url, options, fail, status) {
  return new Promise((resolve, reject) => {
    if (fail) {
      reject(new Error('Fail'))
    } else {
      resolve({ status })
    }
  })
}

// mock (fetch) Request
function Request (url, opts) {
  this.url = url
  this.method = (opts && opts.method) || 'GET'
}

describe('plugin: network breadcrumbs', () => {
  afterEach(() => {
    // undo the global side effects
    plugin.destroy()
  })

  it('should leave a breadcrumb when an XMLHTTPRequest resolves', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    // tell the mock request to succeed with status code 200
    request.send(false, 200)

    expect(client.breadcrumbs.length).toBe(1)
    expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
      type: 'request',
      name: 'XMLHttpRequest succeeded',
      metaData: {
        status: 200,
        request: 'GET /'
      }
    }))
  })

  it('should not leave duplicate breadcrumbs if open() is called twice', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, undefined, window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    request.open('GET', '/')
    request.send(false, 200)
    expect(client.breadcrumbs.length).toBe(1)
  })

  it('should leave a breadcrumb when an XMLHTTPRequest has a failed response', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/this-does-not-exist')
    request.send(false, 404)

    expect(client.breadcrumbs.length).toBe(1)
    expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
      type: 'request',
      name: 'XMLHttpRequest failed',
      metaData: {
        status: 404,
        request: 'GET /this-does-not-exist'
      }
    }))
  })

  it('should leave a breadcrumb when an XMLHTTPRequest has a network error', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()

    request.open('GET', 'https://another-domain.xyz/')
    request.send(true)

    expect(client.breadcrumbs.length).toBe(1)
    expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
      type: 'request',
      name: 'XMLHttpRequest error',
      metaData: {
        request: `GET https://another-domain.xyz/`
      }
    }))
  })

  it('should not leave a breadcrumb for request to bugsnag notify endpoint', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, undefined, window)

    const request = new window.XMLHttpRequest()
    request.open('GET', client.config.endpoints.notify)
    request.send(false, 200)

    expect(client.breadcrumbs.length).toBe(0)
  })

  it('should not leave a breadcrumb for session tracking requests', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, undefined, window)

    const request = new window.XMLHttpRequest()
    request.open('GET', client.config.endpoints.sessions)
    request.send(false, 200)
    expect(client.breadcrumbs.length).toBe(0)
  })

  it('should leave a breadcrumb when a fetch() resolves', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch('/', {}, false, 200).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() succeeded',
        metaData: {
          status: 200,
          request: 'GET /'
        }
      }))
      done()
    })
  })

  it('should handle a fetch(url, { method: null })', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch('/', { method: null }, false, 405).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() failed',
        metaData: {
          status: 405,
          request: 'null /'
        }
      }))
      done()
    })
  })

  it('should handle a fetch() request supplied with a Request object', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    const request = new Request('/')

    window.fetch(request, {}, false, 200).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() succeeded',
        metaData: {
          status: 200,
          request: 'GET /'
        }
      }))
      done()
    })
  })

  it('should handle a fetch() request supplied with a Request object that has a method specified', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    const request = new Request('/', { method: 'PUT' })

    window.fetch(request, {}, false, 200).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() succeeded',
        metaData: {
          status: 200,
          request: 'PUT /'
        }
      }))
      done()
    })
  })

  it('should handle fetch(null)', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch(null, {}, false, 404).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() failed',
        metaData: {
          status: 404,
          request: 'GET null'
        }
      }))
      done()
    })
  })

  it('should handle fetch(url, null)', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch('/', null, false, 200).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() succeeded',
        metaData: {
          status: 200,
          request: 'GET /'
        }
      }))
      done()
    })
  })

  it('should handle fetch(undefined)', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch(undefined, {}, false, 404).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() failed',
        metaData: {
          status: 404,
          request: 'GET undefined'
        }
      }))
      done()
    })
  })

  it('should handle a fetch(request, { method })', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch(new Request('/foo', { method: 'GET' }), { method: 'PUT' }, false, 200).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() succeeded',
        metaData: {
          status: 200,
          request: 'PUT /foo'
        }
      }))
      done()
    })
  })

  it('should handle a fetch(request, { method: null })', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch(new Request('/foo'), { method: null }, false, 405).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() failed',
        metaData: {
          status: 405,
          request: 'null /foo'
        }
      }))
      done()
    })
  })

  it('should handle a fetch(request, { method: undefined })', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch(new Request('/foo'), { method: undefined }, false, 200).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() succeeded',
        metaData: {
          status: 200,
          request: 'GET /foo'
        }
      }))
      done()
    })
  })

  it('should leave a breadcrumb when a fetch() has a failed response', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch('/does-not-exist', {}, false, 404).then(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() failed',
        metaData: {
          status: 404,
          request: 'GET /does-not-exist'
        }
      }))
      done()
    })
  })

  it('should leave a breadcrumb when a fetch() has a network error', (done) => {
    const window = { XMLHttpRequest, fetch }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin, () => [], window)

    window.fetch('https://another-domain.xyz/foo/bar', {}, true).catch(() => {
      expect(client.breadcrumbs.length).toBe(1)
      expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
        type: 'request',
        name: 'fetch() error',
        metaData: {
          request: `GET https://another-domain.xyz/foo/bar`
        }
      }))
      done()
    })
  })

  it('should not be enabled when autoBreadcrumbs=false', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false })
    client.configure()
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    request.send(false, 200)

    expect(client.breadcrumbs.length).toBe(0)
  })

  it('should be enabled when autoBreadcrumbs=false and networkBreadcrumbsEnabled=true', () => {
    const window = { XMLHttpRequest }

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false, networkBreadcrumbsEnabled: true })
    client.configure()
    client.use(plugin, () => [], window)

    const request = new window.XMLHttpRequest()
    request.open('GET', '/')
    request.send(false, 200)

    expect(client.breadcrumbs.length).toBe(1)
  })
})
