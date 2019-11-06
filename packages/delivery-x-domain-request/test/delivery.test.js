const { describe, it, expect } = global

const delivery = require('../')

describe('delivery:XDomainRequest', () => {
  it('sends reports successfully', done => {
    const requests = []

    // mock XDomainRequest class
    function XDomainRequest () {
      this.method = null
      this.url = null
      this.data = null
      requests.push(this)
    }
    XDomainRequest.DONE = 4
    XDomainRequest.prototype.open = function (method, url) {
      this.method = method
      this.url = url
    }
    XDomainRequest.prototype.send = function (data) {
      this.data = data
      this.onload()
    }

    const window = { XDomainRequest, location: { protocol: 'https://' } }
    const payload = { sample: 'payload' }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }
    delivery({ _logger: {}, _config: config }, window).sendEvent(payload, (err) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch(
        /\/echo\/\?apiKey=aaaaaaaa&payloadVersion=4&sentAt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}\.\d{3}Z/
      )
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })

  it('sends sessions successfully', done => {
    const requests = []

    // mock XDomainRequest class
    function XDomainRequest () {
      this.method = null
      this.url = null
      this.data = null
      requests.push(this)
    }
    XDomainRequest.DONE = 4
    XDomainRequest.prototype.open = function (method, url) {
      this.method = method
      this.url = url
    }
    XDomainRequest.prototype.send = function (data) {
      this.data = data
      this.onload()
    }

    const window = { XDomainRequest, location: { protocol: 'https://' } }
    const payload = { sample: 'payload' }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/', sessions: '/sessions/' },
      redactedKeys: []
    }
    delivery({ logger: {}, _config: config }, window).sendSession(payload, (err) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch(
        /\/sessions\/\?apiKey=aaaaaaaa&payloadVersion=1&sentAt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}\.\d{3}Z/
      )
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })
})

describe('delivery:XDomainRequest matchPageProtocol()', () => {
  it('should swap https: -> http: when the current protocol is http', () => {
    expect(
      delivery._matchPageProtocol('https://notify.bugsnag.com/', 'http:')
    ).toBe('http://notify.bugsnag.com/')
  })
  it('should not swap https: -> http: when the current protocol is https', () => {
    expect(
      delivery._matchPageProtocol('https://notify.bugsnag.com/', 'https:')
    ).toBe('https://notify.bugsnag.com/')
  })
})
