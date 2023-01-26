import delivery from '../'
import { Client } from '@bugsnag/core'
import { SessionDeliveryPayload, EventDeliveryPayload } from '@bugsnag/core/client'

interface XDomainRequest {
  method: string | null
  url: string | null
  data: string | null
}

describe('delivery:XDomainRequest', () => {
  it('sends events successfully', done => {
    const requests: XDomainRequest[] = []

    // mock XDomainRequest class
    function XDomainRequest (this: XDomainRequest) {
      this.method = null
      this.url = null
      this.data = null
      requests.push(this)
    }
    XDomainRequest.DONE = 4
    XDomainRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XDomainRequest.prototype.send = function (data: string) {
      this.data = data
      this.onload()
    }

    const window = { XDomainRequest, location: { protocol: 'https://' } } as unknown as Window
    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }
    delivery({ logger: {}, _config: config } as unknown as Client, window).sendEvent(payload, (err) => {
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

  it('calls back with an error when report sending fails', done => {
    // mock XDomainRequest class
    function XDomainRequest () {}
    XDomainRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XDomainRequest.prototype.send = function (method: string, url: string) {
      throw new Error('send error')
    }
    const window = { XDomainRequest, location: { protocol: 'https://' } } as unknown as Window
    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/', sessions: '/sessions/' },
      redactedKeys: []
    }
    delivery({ _logger: { error: () => {} }, _config: config } as unknown as Client, window).sendEvent(payload, (err) => {
      expect(err).not.toBe(null)
      expect(err?.message).toBe('send error')
      done()
    })
  })

  it('logs failures and large payloads', done => {
    // mock XDomainRequest class
    function XDomainRequest () {
    }
    XDomainRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XDomainRequest.prototype.send = function (method: string, url: string) {
      this.onerror()
    }
    const window = { XDomainRequest, location: { protocol: 'https://' } } as unknown as Window

    const lotsOfEvents: any[] = []
    while (JSON.stringify(lotsOfEvents).length < 10e5) {
      lotsOfEvents.push({ errors: [{ errorClass: 'Error', errorMessage: 'long repetitive string'.repeat(1000) }] })
    }
    const payload = {
      events: lotsOfEvents
    } as unknown as EventDeliveryPayload

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/', sessions: '/sessions/' },
      redactedKeys: []
    }
    const logger = { error: jest.fn(), warn: jest.fn() }
    delivery({ _logger: logger, _config: config } as unknown as Client, window).sendEvent(payload, (err) => {
      const expectedError = new Error('Event failed to send')
      expect(err).toStrictEqual(expectedError)
      expect(logger.error).toHaveBeenCalledWith('Event failed to send…', expectedError)
      expect(logger.warn).toHaveBeenCalledWith('Event oversized (1.01 MB)')
      done()
    })
  })

  it('sends sessions successfully', done => {
    const requests: XDomainRequest[] = []

    // mock XDomainRequest class
    function XDomainRequest (this: XDomainRequest, t: typeof window) {
      this.method = null
      this.url = null
      this.data = null
      requests.push(this)
    }
    XDomainRequest.DONE = 4
    XDomainRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XDomainRequest.prototype.send = function (data: string) {
      this.data = data
      this.onload()
    }

    const window = { XDomainRequest, location: { protocol: 'https://' } } as unknown as Window
    const payload = { sample: 'payload' } as unknown as SessionDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/', sessions: '/sessions/' },
      redactedKeys: []
    }
    delivery({ logger: {}, _config: config } as unknown as Client, window).sendSession(payload, (err) => {
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

  it('calls back with an error when session sending fails', done => {
    // mock XDomainRequest class
    function XDomainRequest () {}
    XDomainRequest.prototype.open = function (method: string, url: string) {
      this.method = method
      this.url = url
    }
    XDomainRequest.prototype.send = function (method: string, url: string) {
      throw new Error('send error')
    }
    const window = { XDomainRequest, location: { protocol: 'https://' } } as unknown as Window
    const payload = { sample: 'payload' } as unknown as SessionDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/', sessions: '/sessions/' },
      filters: []
    }
    delivery({ _logger: { error: () => {} }, _config: config } as unknown as Client, window).sendSession(payload, (err) => {
      expect(err).not.toBe(null)
      expect(err?.message).toBe('send error')
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
