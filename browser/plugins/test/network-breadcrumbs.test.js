// magical jasmine globals
const { describe, it, expect, jasmine, XMLHttpRequest, XDomainRequest } = global

const plugin = require('../network-breadcrumbs')

const Client = require('../../../base/client')
const patch = require('../../../base/lib/patch')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://notify.endpoint' }

describe('plugin: network breadcrumbs', () => {
  it('should leave a breadcrumb when an XMLHTTPRequest resolves', (done) => {
    setup((client) => {
      const request = new XMLHttpRequest()
      request.open('GET', '/')

      patch(request, 'onload', () => {
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
  })

  it('should leave a breadcrumb when an XMLHTTPRequest has a failed response', (done) => {
    setup((client) => {
      const request = new XMLHttpRequest()
      request.open('GET', '/this-does-not-exist')

      patch(request, 'onload', () => {
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
  })

  // cross domain requests don't work in environments that support XDomainRequest
  // in that environment request.open will crash and throw a real error, so we shouldn't need
  // a breadcrumb
  if (XDomainRequest) {
    it('should leave a breadcrumb when an XDomainRequest has a network error', (done) => {
      setup((client) => {
        const request = new XDomainRequest()
        request.open('GET', 'https://api.bugsnag.com')

        request.addEventListener('error', () => {
          expect(client.breadcrumbs.length).toBe(1)
          expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
            type: 'network',
            name: 'XDomainRequest error',
            metaData: {
              request: 'GET https://api.bugsnag.com'
            }
          }))
          done()
        })

        request.send()
      })
    })
  } else {
    it('should leave a breadcrumb when an XMLHTTPRequest has a network error', (done) => {
      setup((client) => {
        const request = new XMLHttpRequest()
        request.open('GET', 'https://api.bugsnag.com')

        request.addEventListener('error', () => {
          expect(client.breadcrumbs.length).toBe(1)
          expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
            type: 'network',
            name: 'XMLHttpRequest error',
            metaData: {
              request: 'GET https://api.bugsnag.com'
            }
          }))
          done()
        })

        request.send()
      })
    })
  }

  it('should not leave a breadcrumb for request to bugsnag notify endpoint', (done) => {
    setup((client) => {
      const request = new XMLHttpRequest()
      request.open('GET', VALID_NOTIFIER.url)

      request.addEventListener('error', () => {
        expect(client.breadcrumbs.length).toBe(0)
        done()
      })

      request.send()
    })
  })

  if (global.fetch) {
    it('should leave a breadcrumb when a fetch() resolves', (done) => {
      setup((client) => {
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
    })
    it('should leave a breadcrumb when a fetch() has a failed response', (done) => {
      setup((client) => {
        global.fetch('http://jsonplaceholder.typicode.com/posts/asdf').then(() => {
          expect(client.breadcrumbs.length).toBe(1)
          expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
            type: 'network',
            name: 'fetch() failed',
            metaData: {
              status: 404,
              request: 'GET http://jsonplaceholder.typicode.com/posts/asdf'
            }
          }))
          done()
        })
      })
    })

    it('should leave a breadcrumb when a fetch() has a network error', (done) => {
      setup((client) => {
        global.fetch('https://api.bugsnag.com').catch(() => {
          expect(client.breadcrumbs.length).toBe(1)
          expect(client.breadcrumbs[0]).toEqual(jasmine.objectContaining({
            type: 'network',
            name: 'fetch() error',
            metaData: {
              request: 'GET https://api.bugsnag.com'
            }
          }))
          done()
        })
      })
    })
  }
})

function setup (callback) {
  // setup client and plugin
  const client = new Client(VALID_NOTIFIER)
  client.configure({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
  client.use(plugin)
  // perform the test
  callback(client)
  // undo the global side effects
  plugin.destroy()
}
