import delivery from '../'
import { Client } from '@bugsnag/core'
import { EventDeliveryPayload } from '@bugsnag/core/client'

interface MockXMLHttpRequest {
  method: string | null
  url: string | null
  data: string | null
  headers: { [key: string]: string }
  readyState: number | null
  status: number
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
      this.readyState = XMLHttpRequest.UNSENT
      requests.push(this)
    }
    XMLHttpRequest.UNSENT = 0
    XMLHttpRequest.OPENED = 1
    XMLHttpRequest.HEADERS_RECEIVED = 2
    XMLHttpRequest.LOADING = 3
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
      this.readyState = XMLHttpRequest.OPENED
      this.onreadystatechange()
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.HEADERS_RECEIVED
      this.onreadystatechange()

      setTimeout(() => {
        this.status = 200
        this.readyState = XMLHttpRequest.DONE
        this.onreadystatechange()
      }, 500)
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    delivery({ _logger: {}, _config: config } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendEvent(payload, (err: any) => {
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

  it('calls back with an error when report sending fails', done => {
    const requests: MockXMLHttpRequest[] = []

    // mock XMLHttpRequest class
    function XMLHttpRequest (this: MockXMLHttpRequest) {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = XMLHttpRequest.UNSENT
      requests.push(this)
    }
    XMLHttpRequest.UNSENT = 0
    XMLHttpRequest.OPENED = 1
    XMLHttpRequest.HEADERS_RECEIVED = 2
    XMLHttpRequest.LOADING = 3
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
      this.readyState = XMLHttpRequest.OPENED
      this.onreadystatechange()
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.HEADERS_RECEIVED
      this.onreadystatechange()

      setTimeout(() => {
        this.status = 500
        this.readyState = XMLHttpRequest.DONE
        this.onreadystatechange()
      }, 500)
    }

    const logger = { error: jest.fn(), warn: jest.fn() }
    const payload = { events: [] } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    delivery({ _logger: logger, _config: config } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendEvent(payload, (err?: Error | null) => {
      const expectedError = new Error('Request failed with status 500')
      expect(err).toStrictEqual(expectedError)
      expect(logger.error).toHaveBeenCalledWith('Event failed to send…', expectedError)
      done()
    })
  })

  it('logs failures and large payloads', done => {
    const requests: MockXMLHttpRequest[] = []

    // mock XMLHttpRequest class
    function XMLHttpRequest (this: MockXMLHttpRequest) {
      this.method = null
      this.url = null
      this.data = null
      this.headers = {}
      this.readyState = XMLHttpRequest.UNSENT
      requests.push(this)
    }
    XMLHttpRequest.UNSENT = 0
    XMLHttpRequest.OPENED = 1
    XMLHttpRequest.HEADERS_RECEIVED = 2
    XMLHttpRequest.LOADING = 3
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
      this.ready = XMLHttpRequest.OPENED
      this.onreadystatechange()
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.HEADERS_RECEIVED
      this.onreadystatechange()
      this.readyState = XMLHttpRequest.LOADING
      this.onreadystatechange()

      setTimeout(() => {
        this.status = 400
        this.readyState = XMLHttpRequest.DONE
        this.onreadystatechange()
      }, 500)
    }

    const lotsOfEvents: any[] = []
    while (JSON.stringify(lotsOfEvents).length < 10e5) {
      lotsOfEvents.push({ errors: [{ errorClass: 'Error', errorMessage: 'long repetitive string'.repeat(1000) }] })
    }
    const payload = {
      events: lotsOfEvents
    } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }
    const logger = { error: jest.fn(), warn: jest.fn() }

    delivery({ _logger: logger, _config: config } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendEvent(payload, (err: any) => {
      const expectedError = new Error('Request failed with status 400')
      expect(err).toStrictEqual(expectedError)
      expect(logger.error).toHaveBeenCalledWith('Event failed to send…', expectedError)
      expect(logger.warn).toHaveBeenCalledWith('Event oversized (1.01 MB)')
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
      this.readyState = XMLHttpRequest.UNSENT
      requests.push(this)
    }
    XMLHttpRequest.UNSENT = 0
    XMLHttpRequest.OPENED = 1
    XMLHttpRequest.HEADERS_RECEIVED = 2
    XMLHttpRequest.LOADING = 3
    XMLHttpRequest.DONE = 4
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
      this.readyState = XMLHttpRequest.OPENED
      this.onreadystatechange()
    }
    XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
      this.headers[key] = val
    }
    XMLHttpRequest.prototype.send = function (data: string) {
      this.data = data
      this.readyState = XMLHttpRequest.HEADERS_RECEIVED
      this.onreadystatechange()
      this.readyState = XMLHttpRequest.LOADING
      this.onreadystatechange()

      setTimeout(() => {
        this.status = 200
        this.readyState = XMLHttpRequest.DONE
        this.onreadystatechange()
      }, 500)
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/', sessions: '/echo/' },
      redactedKeys: []
    }
    delivery({ _config: config, _logger: {} } as unknown as Client, { XMLHttpRequest } as unknown as Window).sendSession(payload, (err) => {
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
