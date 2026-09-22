import delivery from '../src/delivery'
import type { Client, EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core'

interface MockXMLHttpRequest {
  method: string | null
  url: string | null
  data: string | null
  headers: Record<string, string>
  readyState: number
  status: number
  onreadystatechange: () => void
  open: (method: string, url: string) => void
  setRequestHeader: (key: string, val: string) => void
  send: (data: string) => void
}

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
})

const createClient = (config: Record<string, any>, logger = createLogger()): Client =>
  ({
    _logger: logger,
    _config: config
  } as unknown as Client)

const createMockXHR = (status = 200, delay = 0) => {
  const requests: MockXMLHttpRequest[] = []

  function XMLHttpRequest (this: MockXMLHttpRequest) {
    this.method = null
    this.url = null
    this.data = null
    this.headers = {}
    this.readyState = XMLHttpRequest.UNSENT
    this.status = 0
    this.onreadystatechange = () => {}
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
    if (this.onreadystatechange) this.onreadystatechange()
  }

  XMLHttpRequest.prototype.setRequestHeader = function (key: string, val: string) {
    this.headers[key] = val
  }

  XMLHttpRequest.prototype.send = function (data: string) {
    this.data = data
    this.readyState = XMLHttpRequest.HEADERS_RECEIVED
    if (this.onreadystatechange) this.onreadystatechange()

    this.readyState = XMLHttpRequest.LOADING
    if (this.onreadystatechange) this.onreadystatechange()

    setTimeout(() => {
      this.status = status
      this.readyState = XMLHttpRequest.DONE
      if (this.onreadystatechange) this.onreadystatechange()
    }, delay)
  }

  return { requests, XMLHttpRequest: XMLHttpRequest as any }
}

describe('delivery:XMLHttpRequest', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends events successfully', done => {
    const { requests, XMLHttpRequest } = createMockXHR(200)
    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'echo/' },
      redactedKeys: [],
      sendPayloadChecksums: true
    }

    const client = createClient(config)
    const win = { ...window, XMLHttpRequest, isSecureContext: true } as any

    delivery(client, win).sendEvent(payload, (err: any) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch('echo/')
      expect(requests[0].headers['Content-Type']).toEqual('application/json')
      expect(requests[0].headers['Bugsnag-Api-Key']).toEqual('aaaaaaaa')
      expect(requests[0].headers['Bugsnag-Payload-Version']).toEqual('4')
      expect(requests[0].headers['Bugsnag-Sent-At']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      if (requests[0].headers['Bugsnag-Integrity']) {
        expect(requests[0].headers['Bugsnag-Integrity']).toMatch(/^sha1 /)
      }
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })

  it('omits the bugsnag integrity header when sendPayloadChecksums is false', done => {
    const { requests, XMLHttpRequest } = createMockXHR(200)
    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'https/echo/' },
      redactedKeys: [],
      sendPayloadChecksums: false
    }

    const client = createClient(config)
    const win = { ...window, XMLHttpRequest, isSecureContext: true } as any

    delivery(client, win).sendEvent(payload, (err: any) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].headers['Bugsnag-Integrity']).toBeUndefined()
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })

  it('omits the bugsnag integrity header when not in a secure context', done => {
    const { requests, XMLHttpRequest } = createMockXHR(200)
    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'https/echo/' },
      redactedKeys: []
    }

    const client = createClient(config)
    const win = { ...window, XMLHttpRequest, isSecureContext: false } as any

    delivery(client, win).sendEvent(payload, (err: any) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].headers['Bugsnag-Integrity']).toBeUndefined()
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })

  it('calls back with an error when report sending fails', done => {
    const { requests, XMLHttpRequest } = createMockXHR(500)
    const logger = createLogger()
    const payload = { events: [] } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    const client = createClient(config, logger)
    const win = { XMLHttpRequest } as any

    delivery(client, win).sendEvent(payload, (err?: Error | null) => {
      const expectedError = new Error('Request failed with status 500')
      expect(err).toStrictEqual(expectedError)
      expect(logger.error).toHaveBeenCalledWith('Event failed to send…', expectedError)
      done()
    })
  })

  it('logs failures and large payloads', done => {
    const { requests, XMLHttpRequest } = createMockXHR(400)
    const logger = createLogger()

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

    const client = createClient(config, logger)
    const win = { XMLHttpRequest } as any

    delivery(client, win).sendEvent(payload, (err: any) => {
      const expectedError = new Error('Request failed with status 400')
      expect(err).toStrictEqual(expectedError)
      expect(logger.error).toHaveBeenCalledWith('Event failed to send…', expectedError)
      expect(logger.warn).toHaveBeenCalledWith('Event oversized (1.01 MB)')
      done()
    })
  })

  it('sends sessions successfully', done => {
    const { requests, XMLHttpRequest } = createMockXHR(200)
    const payload = { sample: 'payload' } as unknown as SessionDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/', sessions: '/echo/' },
      redactedKeys: [],
      sendPayloadChecksums: true
    }

    const client = createClient(config)
    const win = { ...window, XMLHttpRequest, isSecureContext: true } as any

    delivery(client, win).sendSession(payload, (err) => {
      expect(err).toBe(null)
      expect(requests.length).toBe(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch('/echo/')
      expect(requests[0].headers['Content-Type']).toEqual('application/json')
      expect(requests[0].headers['Bugsnag-Api-Key']).toEqual('aaaaaaaa')
      expect(requests[0].headers['Bugsnag-Payload-Version']).toEqual('1')
      expect(requests[0].headers['Bugsnag-Sent-At']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      if (requests[0].headers['Bugsnag-Integrity']) {
        expect(requests[0].headers['Bugsnag-Integrity']).toMatch(/^sha1 /)
      }
      expect(requests[0].data).toBe(JSON.stringify(payload))
      done()
    })
  })

  it('prevents session delivery with incomplete config', done => {
    const { requests, XMLHttpRequest } = createMockXHR(200)
    const payload = { sample: 'payload' } as unknown as SessionDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: null, sessions: null },
      redactedKeys: []
    }

    const client = createClient(config)
    const win = { XMLHttpRequest } as any

    delivery(client, win).sendSession(payload, (err) => {
      expect(err).toStrictEqual(new Error('Session not sent due to incomplete endpoint configuration'))
      expect(requests.length).toBe(0)
      done()
    })
  })
})