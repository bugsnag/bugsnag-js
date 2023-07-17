/* eslint-disable @typescript-eslint/no-non-null-assertion */
import plugin from '../'

import Client from '@bugsnag/core/client'
import { Config } from '@bugsnag/core'

class XMLHttpRequest {
  _listeners: { load: () => void, error: () => void }
  status: number | null;

  constructor () {
    this._listeners = { load: () => {}, error: () => {} }
    this.status = null
  }

  open (method: string, url: string | { toString: () => any }) {
  }

  send (fail: boolean, status: number | null = null) {
    if (fail) {
      this._listeners.error.call(this)
    } else {
      this.status = status
      this._listeners.load.call(this)
    }
  }

  addEventListener (evt: 'load'| 'error', listener: () => void) {
    this._listeners[evt] = listener
  }

  removeEventListener (evt: 'load'| 'error', listener: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (listener === this._listeners[evt]) delete this._listeners[evt]
  }
}

// mock fetch
function fetch (urlOrRequest: string | Request | null | undefined, options: {} | null, fail: boolean, status: number | null = null) {
  return new Promise((resolve, reject) => {
    if (fail) {
      reject(new Error('Fail'))
    } else {
      resolve({ status })
    }
  })
}

// mock (fetch) Request
class Request {
  url: string
  method: string

  constructor (url: string, opts?: { method: string }) {
    this.url = url
    this.method = (opts?.method) || 'GET'
  }
}

describe('plugin: network breadcrumbs', () => {
  let p: any

  afterEach(() => {
    if (p) p.destroy()
  })

  it('should leave a breadcrumb when an XMLHTTPRequest resolves', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', '/')
    // tell the mock request to succeed with status code 200
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest succeeded',
      metadata: {
        status: 200,
        request: 'GET /',
        duration: expect.any(Number)
      }
    }))
  })

  it('should not leave duplicate breadcrumbs if open() is called twice', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', '/')
    request.open('GET', '/')
    request.send(false, 200)
    expect(client._breadcrumbs.length).toBe(1)
  })

  it('should leave a breadcrumb when an XMLHTTPRequest has a failed response', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', '/this-does-not-exist')
    request.send(false, 404)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest failed',
      metadata: {
        status: 404,
        request: 'GET /this-does-not-exist',
        duration: expect.any(Number)
      }
    }))
  })

  it('should leave a breadcrumb when an XMLHTTPRequest has a network error', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest

    request.open('GET', 'https://another-domain.xyz/')
    request.send(true)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest error',
      metadata: {
        request: 'GET https://another-domain.xyz/',
        duration: expect.any(Number)
      }
    }))
  })

  it('should not leave a breadcrumb for request to bugsnag notify endpoint', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] } as unknown as Config)

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', client._config.endpoints!.notify)
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(0)
  })

  it('should not leave a breadcrumb for session tracking requests', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] } as unknown as Config)

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', client._config.endpoints!.sessions)
    request.send(false, 200)
    expect(client._breadcrumbs.length).toBe(0)
  })

  it('should leave a breadcrumb when the request URL is not a string', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    p = plugin([], window)
    const client = new Client({ apiKey: 'abcabcabcabcabcabcabc1234567890f', logger, plugins: [p] })

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', { toString: () => 'https://example.com' })
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest succeeded',
      metadata: {
        status: 200,
        request: 'GET https://example.com',
        duration: expect.any(Number)
      }
    }))
  })

  it('should leave a breadcrumb when the request URL is not a string for a request that errors', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    p = plugin([], window)
    const client = new Client({ apiKey: 'abcabcabcabcabcabcabc1234567890f', logger, plugins: [p] })

    const request = new window.XMLHttpRequest() as unknown as XMLHttpRequest
    request.open('GET', { toString: () => 'https://example.com' })
    request.send(true)

    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
      type: 'request',
      message: 'XMLHttpRequest error',
      metadata: {
        request: 'GET https://example.com',
        duration: expect.any(Number)
      }
    }))
  })

  it('should leave a breadcrumb when a fetch() resolves', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch('/', {}, false, 200).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() succeeded',
        metadata: {
          status: 200,
          request: 'GET /',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle a fetch(url, { method: null })', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch('/', { method: null }, false, 405).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() failed',
        metadata: {
          status: 405,
          request: 'null /',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle a fetch() request supplied with a Request object', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const request = new Request('/')

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch(request, {}, false, 200).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() succeeded',
        metadata: {
          status: 200,
          request: 'GET /',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle a fetch() request supplied with a Request object that has a method specified', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const request = new Request('/', { method: 'PUT' })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch(request, {}, false, 200).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() succeeded',
        metadata: {
          status: 200,
          request: 'PUT /',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle fetch(null)', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch(null, {}, false, 404).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() failed',
        metadata: {
          status: 404,
          request: 'GET null',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle fetch(url, null)', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch('/', null, false, 200).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() succeeded',
        metadata: {
          status: 200,
          request: 'GET /',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle fetch(undefined)', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch(undefined, {}, false, 404).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() failed',
        metadata: {
          status: 404,
          request: 'GET undefined',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle a fetch(request, { method })', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch(new Request('/foo', { method: 'GET' }), { method: 'PUT' }, false, 200).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() succeeded',
        metadata: {
          status: 200,
          request: 'PUT /foo',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle a fetch(request, { method: null })', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch(new Request('/foo'), { method: null }, false, 405).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() failed',
        metadata: {
          status: 405,
          request: 'null /foo',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should handle a fetch(request, { method: undefined })', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch(new Request('/foo'), { method: undefined }, false, 200).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() succeeded',
        metadata: {
          status: 200,
          request: 'GET /foo',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should leave a breadcrumb when a fetch() has a failed response', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch('/does-not-exist', {}, false, 404).then(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() failed',
        metadata: {
          status: 404,
          request: 'GET /does-not-exist',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should leave a breadcrumb when a fetch() has a network error', (done) => {
    const window = { XMLHttpRequest, fetch } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const mockFetch = window.fetch as unknown as typeof fetch
    mockFetch('https://another-domain.xyz/foo/bar', {}, true).catch(() => {
      expect(client._breadcrumbs.length).toBe(1)
      expect(client._breadcrumbs[0]).toEqual(expect.objectContaining({
        type: 'request',
        message: 'fetch() error',
        metadata: {
          request: 'GET https://another-domain.xyz/foo/bar',
          duration: expect.any(Number)
        }
      }))
      done()
    })
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [], plugins: [p] })

    const request = new XMLHttpRequest()
    request.open('GET', '/')
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(0)
  })

  it('should be enabled when enabledBreadcrumbTypes=["request"]', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['request'], plugins: [p] })

    const request = new XMLHttpRequest()
    request.open('GET', '/')
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(1)
  })

  it('should be enabled when enabledBreadcrumbTypes=null', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin([], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [p] })

    const request = new XMLHttpRequest()
    request.open('GET', '/')
    request.send(false, 200)

    expect(client._breadcrumbs.length).toBe(1)
  })

  it('should strip query string data before checking a url is ignored', () => {
    const window = { XMLHttpRequest } as unknown as Window & typeof globalThis

    p = plugin(['/ignoreme'], window)
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [p] })

    const request0 = new XMLHttpRequest()
    request0.open('GET', '/')
    request0.send(false, 200)

    const request1 = new XMLHttpRequest()
    request1.open('GET', '/ignoreme?123')
    request1.send(false, 200)

    const request2 = new XMLHttpRequest()
    request2.open('GET', '/ignoremeno')
    request2.send(false, 200)

    expect(client._breadcrumbs.length).toBe(2)
  })
})
