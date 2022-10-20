import delivery from '../'
import { Client } from '@bugsnag/core'
import { EventDeliveryPayload } from '@bugsnag/core/client'

interface MockXMLHttpRequest {
  method: string | null
  url: string | null
  data: string | null
  headers: { [key: string]: string }
  readyState: string | null
}

describe('delivery:XMLHttpRequest', () => {
  it('sends events successfully', done => {
    const requests: MockXMLHttpRequest[] = []

    // mock XMLHttpRequest class
    function XMLHttpRequest (this: MockXMLHttpRequest) {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = null
      requests.push(this)
    }
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.DONE
      this.onreadystatechange()
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }
    delivery({ logger: {}, _config: config } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendEvent(payload, (err: any) => {
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

  it('prevents event delivery with incomplete config', done => {
    const requests: MockXMLHttpRequest[] = []

    // mock XMLHttpRequest class
    function XMLHttpRequest (this: MockXMLHttpRequest) {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = null
      requests.push(this)
    }
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.DONE
      this.onreadystatechange()
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: null },
      redactedKeys: []
    }
    delivery({ logger: {}, _config: config } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendEvent(payload, (err: any) => {
      expect(err).toStrictEqual(new Error('Event not sent due to incomplete endpoint configuration'))
      expect(requests.length).toBe(0)
      done()
    })
  })

  it('sends sessions successfully', done => {
    const requests: MockXMLHttpRequest[] = []

    // mock XMLHttpRequest class
    function XMLHttpRequest (this: MockXMLHttpRequest) {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = null
      requests.push(this)
    }
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.DONE
      this.onreadystatechange()
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/', sessions: '/echo/' },
      redactedKeys: []
    }
    delivery({ _config: config, logger: {} } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendSession(payload, (err) => {
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

  it('prevents session delivery with incomplete config', done => {
    const requests: MockXMLHttpRequest[] = []

    // mock XMLHttpRequest class
    function XMLHttpRequest (this: MockXMLHttpRequest) {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = null
      requests.push(this)
    }
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.DONE
      this.onreadystatechange()
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: null, sessions: null },
      redactedKeys: []
    }
    delivery({ _config: config, logger: {} } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendSession(payload, (err) => {
      expect(err).toStrictEqual(new Error('Session not sent due to incomplete endpoint configuration'))
      expect(requests.length).toBe(0)
      done()
    })
  })
})
