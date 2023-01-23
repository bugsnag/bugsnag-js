import delivery from '../'
import http from 'http'
import { Client } from '@bugsnag/core'
import { EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core/client'
import { AddressInfo } from 'net'

interface Request {
  url?: string
  method?: string
  headers: http.IncomingHttpHeaders
  body: string
}

const mockServer = (successCode = 200) => {
  const requests: Request[] = []
  return {
    requests,
    server: http.createServer((req, res) => {
      let body = ''
      req.on('data', b => { body += b })
      req.on('end', () => {
        requests.push({
          url: req.url,
          method: req.method,
          headers: req.headers,
          body
        })
        res.statusCode = successCode
        res.end('OK')
      })
    })
  }
}

describe('delivery:node', () => {
  it('sends events successfully', done => {
    const { requests, server } = mockServer()
    server.listen((err: Error) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      delivery({ _logger: {}, _config: config } as unknown as Client).sendEvent(payload, (err) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/notify/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-payload-version']).toEqual('4')
        expect(requests[0].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(requests[0].body).toBe(JSON.stringify(payload))

        server.close()
        done()
      })
    })
  })

  it('prevents event delivery with incomplete config', done => {
    const { requests, server } = mockServer()
    server.listen((err: Error) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: null, sessions: null },
        redactedKeys: []
      }

      delivery({ _logger: { error: jest.fn() }, _config: config } as unknown as Client).sendEvent(payload, (err) => {
        expect(err).toStrictEqual(new Error('Event not sent due to incomplete endpoint configuration'))
        expect(requests.length).toBe(0)

        server.close()
        done()
      })
    })
  })

  it('logs failures and large payloads', done => {
    const { server } = mockServer(400)
    server.listen((err: Error) => {
      expect(err).toBeUndefined()

      const lotsOfEvents: any[] = []
      while (JSON.stringify(lotsOfEvents).length < 10e5) {
        lotsOfEvents.push({ errors: [{ errorClass: 'Error', errorMessage: 'long repetitive string'.repeat(1000) }] })
      }
      const payload = {
        events: lotsOfEvents
      } as unknown as EventDeliveryPayload

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }

      const logger = { error: jest.fn(), warn: jest.fn() }

      delivery({ _logger: logger, _config: config } as unknown as Client).sendEvent(payload, (err) => {
        expect(err).toStrictEqual(new Error('Bad statusCode from API: 400\nOK'))
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Event failed to send…'), expect.any(Error))
        expect(logger.warn).toHaveBeenCalledWith('Event oversized (1.01 MB)')

        server.close()
        done()
      })
    })
  })

  it('sends sessions successfully', done => {
    const { requests, server } = mockServer(202)
    server.listen((err: Error) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload' } as unknown as SessionDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: 'blah', sessions: `http://0.0.0.0:${(server.address() as AddressInfo).port}/sessions/` },
        redactedKeys: []
      }
      delivery({ _logger: {}, _config: config } as unknown as Client).sendSession(payload, (err) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/sessions/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-payload-version']).toEqual('1')
        expect(requests[0].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(requests[0].body).toBe(JSON.stringify(payload))

        server.close()
        done()
      })
    })
  })

  it('handles errors gracefully (ECONNREFUSED)', done => {
    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://0.0.0.0:9999/notify/' },
      redactedKeys: []
    }
    let didLog = false
    const log = () => { didLog = true }
    delivery({ _config: config, _logger: { error: log } } as unknown as Client).sendEvent(payload, (err: any) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(err.code).toBe('ECONNREFUSED')
      done()
    })
  })

  it('handles errors gracefully (socket hang up)', done => {
    const server = http.createServer((req, res) => {
      req.connection.destroy()
    })

    server.listen((err: Error) => {
      expect(err).toBeFalsy()
      const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ _config: config, _logger: { error: log } } as unknown as Client).sendEvent(payload, (err: any) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(err.code).toBe('ECONNRESET')

        server.close()
        done()
      })
    })
  })

  it('handles errors gracefully (HTTP 503)', done => {
    const server = http.createServer((req, res) => {
      res.statusCode = 503
      res.end('NOT OK')
    })

    server.listen((err: Error) => {
      expect(err).toBeFalsy()
      const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ _config: config, _logger: { error: log } } as unknown as Client).sendEvent(payload, (err) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()

        server.close()
        done()
      })
    })
  })
})
