const { describe, it, expect } = global

const delivery = require('../')

describe('delivery:XMLHttpRequest', () => {
  it('sends reports successfully', done => {
    const requests = []

    // mock XMLHttpRequest class
    function XMLHttpRequest () {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = null
      requests.push(this)
    }
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method, url) {
      this.method = method
      this.url = url
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key, val) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data) {
      this.data = data
      this.readyState = XMLHttpRequest.DONE
      this.onreadystatechange()
    }

    const payload = { sample: 'payload' }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }
    delivery({ _config: config, _logger: {} }, { XMLHttpRequest }).sendEvent(payload, (err) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch('/echo/')
      expect(requests[0].headers['Content-Type']).toEqual('application/json')
      expect(requests[0].headers['Bugsnag-Api-Key']).toEqual('aaaaaaaa')
      expect(requests[0].headers['Bugsnag-Payload-Version']).toEqual('4')
      expect(requests[0].headers['Bugsnag-Sent-At']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })

  it('sends sessions successfully', done => {
    const requests = []

    // mock XMLHttpRequest class
    function XMLHttpRequest () {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = null
      requests.push(this)
    }
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method, url) {
      this.method = method
      this.url = url
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key, val) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data) {
      this.data = data
      this.readyState = XMLHttpRequest.DONE
      this.onreadystatechange()
    }

    const payload = { sample: 'payload' }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/', sessions: '/echo/' },
      redactedKeys: []
    }
    delivery({ _config: config, _logger: {} }, { XMLHttpRequest }).sendSession(payload, (err) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch('/echo/')
      expect(requests[0].headers['Content-Type']).toEqual('application/json')
      expect(requests[0].headers['Bugsnag-Api-Key']).toEqual('aaaaaaaa')
      expect(requests[0].headers['Bugsnag-Payload-Version']).toEqual('1')
      expect(requests[0].headers['Bugsnag-Sent-At']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })
})
