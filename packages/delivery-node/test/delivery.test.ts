import delivery from '../'
import http from 'http'
import { Client } from '@bugsnag/core'
import { Delivery, EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core/client'
import { AddressInfo } from 'net'

type NodeDelivery = Delivery & { _flush(timeoutMs?: number): Promise<void> }

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

const noop = () => {}

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

  it('can flush successfully', done => {
    const { requests, server } = mockServer()
    server.listen((err: Error) => {
      expect(err).toBeUndefined()

      const eventPayload = { sample: 'eventPayload' } as unknown as EventDeliveryPayload
      const eventPayload2 = { example: 'eventPayload2' } as unknown as EventDeliveryPayload
      const sessionPayload = { sample: 'sessionPayload' } as unknown as SessionDeliveryPayload
      const sessionPayload2 = { sample: 'sessionPayload2' } as unknown as SessionDeliveryPayload

      const url = `http://0.0.0.0:${(server.address() as AddressInfo).port}`
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `${url}/notify/`, sessions: `${url}/sessions/` },
        redactedKeys: []
      }

      const client = { _logger: { error: console.error.bind(console) }, _config: config } as unknown as Client
      const _delivery = delivery(client) as NodeDelivery

      _delivery.sendEvent(eventPayload, noop)
      _delivery.sendEvent(eventPayload2, noop)
      _delivery.sendSession(sessionPayload, noop)
      _delivery.sendSession(sessionPayload2, noop)

      _delivery._flush().then(() => {
        // the payloads could be delivered out of order so we can't match them
        // to a specific request body, i.e. payloads[1] may not be requests[1]
        const payloads = [
          JSON.stringify(eventPayload),
          JSON.stringify(eventPayload2),
          JSON.stringify(sessionPayload),
          JSON.stringify(sessionPayload2)
        ]

        expect(requests.length).toBe(payloads.length)

        payloads.forEach((_, i) => {
          expect(requests[i].method).toBe('POST')
          expect(requests[i].url).toMatch(new RegExp('/(notify|sessions)/'))
          expect(requests[i].headers['content-type']).toEqual('application/json')
          expect(requests[i].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
          expect(requests[i].headers['bugsnag-payload-version']).toMatch(/^(1|4)$/)
          expect(requests[i].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

          expect(payloads).toContain(requests[i].body)
        })

        // ensure the received payloads are different as the 'toContain' would
        // pass if they were all the same
        expect(requests[0].body).not.toBe(requests[1].body)
        expect(requests[0].body).not.toBe(requests[2].body)
        expect(requests[0].body).not.toBe(requests[3].body)
        expect(requests[1].body).not.toBe(requests[2].body)
        expect(requests[1].body).not.toBe(requests[3].body)
        expect(requests[2].body).not.toBe(requests[3].body)

        server.close()
        done()
      })
    })
  })

  it('will timeout if flush takes too long', done => {
    const { requests, server } = mockServer()
    server.listen((err: Error) => {
      expect(err).toBeUndefined()

      const numberOfEventsToSend = 25
      const events: EventDeliveryPayload[] =
        Array.from({ length: numberOfEventsToSend })
          .map((_, i) => ({ sample: `event payload ${i}` } as unknown as EventDeliveryPayload))

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }

      const client = { _logger: { error: console.error.bind(console) }, _config: config } as unknown as Client
      const _delivery = delivery(client) as NodeDelivery

      events.forEach(event => _delivery.sendEvent(event, noop))

      _delivery._flush(0)
        .then(() => { throw new Error('Promise resolved when it should not!') })
        .catch((err: Error) => {
          expect(err.message).toBe('_flush timed out after 0ms')

          // it's possible for some events to be delivered at this point, but
          // it's extremely unlikely for all of them to have been delivered
          expect(requests.length).toBeLessThan(numberOfEventsToSend)

          // allow any outstanding events to be delivered before closing the
          // server, otherwise this will cause errors
          _delivery._flush().then(() => {
            server.close()
            done()
          })
        })
    })
  })
})
