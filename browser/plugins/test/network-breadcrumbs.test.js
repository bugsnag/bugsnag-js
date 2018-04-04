// magical jasmine globals
const { describe, it, expect, jasmine, beforeEach, afterEach } = global

const plugin = require('../network-breadcrumbs')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

let client

beforeEach(() => {
  // setup client and plugin
  client = new Client(VALID_NOTIFIER)
  client.configure({
    apiKey: 'aaaa-aaaa-aaaa-aaaa',
    endpoint: 'http://localhost:55854/reports',
    sessionEndpoint: 'http://localhost:55854/sessions'
  })
  client.use(plugin)
})

afterEach(() => {
  // undo the global side effects
  plugin.destroy()
})

describe('plugin: network breadcrumbs', () => {
  if ('addEventListener' in window.XMLHttpRequest.prototype) {
    it('should leave a breadcrumb when an XMLHTTPRequest resolves', (done) => {
      const request = new window.XMLHttpRequest()
      request.open('GET', '/')

      request.addEventListener('load', () => {
        expect(client.breadcrumbs.length).toBe(1)
        expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
          type: 'network',
          name: 'XMLHttpRequest succeeded',
          metaData: {
            status: 200,
            request: 'GET /'
          }
        }))
        done()
      })

      request.send()
    })

    it('should not leave duplicate breadcrumbs if open() is called twice', (done) => {
      const request = new window.XMLHttpRequest()
      request.open('GET', '/')
      request.open('GET', '/')

      request.addEventListener('load', () => {
        expect(client.breadcrumbs.length).toBe(1)
        done()
      })

      request.send()
    })

    it('should leave a breadcrumb when an XMLHTTPRequest has a failed response', (done) => {
      const request = new window.XMLHttpRequest()
      request.open('GET', '/this-does-not-exist')

      request.addEventListener('load', () => {
        expect(client.breadcrumbs.length).toBe(1)
        expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
          type: 'network',
          name: 'XMLHttpRequest failed',
          metaData: {
            status: 404,
            request: 'GET /this-does-not-exist'
          }
        }))
        done()
      })

      request.send()
    })

    // Browsers that support XDomainRequest will throw a real error when trying to do a cross
    // domain request. We don't need a breadcrumb for this since bugsnag will track that error
    if (!window.XDomainRequest) {
      it('should leave a breadcrumb when an XMLHTTPRequest has a network error', (done) => {
        const request = new window.XMLHttpRequest()
        request.open('GET', 'http://localhost:55854/?nocors')

        request.addEventListener('error', () => {
          expect(client.breadcrumbs.length).toBe(1)
          expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
            type: 'network',
            name: 'XMLHttpRequest error',
            metaData: {
              request: 'GET http://localhost:55854/?nocors'
            }
          }))
          done()
        })

        request.addEventListener('load', () => {
          console.warn(`This browser didn’t care about the lack of CORS headers on the response (${window.navigator.userAgent})`)
          done()
        })

        request.send()
      })

      it('should not leave a breadcrumb for request to bugsnag notify endpoint', (done) => {
        const request = new window.XMLHttpRequest()
        request.open('GET', client.config.endpoint)

        request.addEventListener('load', () => {
          expect(client.breadcrumbs.length).toBe(0)
          done()
        })

        request.send()
      })

      it('should not leave a breadcrumb for session tracking requests', (done) => {
        const request = new window.XMLHttpRequest()
        request.open('GET', client.config.sessionEndpoint)

        request.addEventListener('load', () => {
          expect(client.breadcrumbs.length).toBe(0)
          done()
        })

        request.send()
      })
    }
  }

  if (global.fetch) {
    it('should leave a breadcrumb when a fetch() resolves', (done) => {
      global.fetch('/').then(() => {
        expect(client.breadcrumbs.length).toBe(1)
        expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
          type: 'network',
          name: 'fetch() succeeded',
          metaData: {
            status: 200,
            request: 'GET /'
          }
        }))
        done()
      })
    })

    it('should leave a breadcrumb when a fetch() has a failed response', (done) => {
      global.fetch('/does-not-exist').then(() => {
        expect(client.breadcrumbs.length).toBe(1)
        expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
          type: 'network',
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
      global.fetch('http://localhost:55854/?nocors').catch(() => {
        expect(client.breadcrumbs.length).toBe(1)
        expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
          type: 'network',
          name: 'fetch() error',
          metaData: {
            request: 'GET http://localhost:55854/?nocors'
          }
        }))
        done()
      })
    })
  }
})
