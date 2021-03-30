import { createServer, IncomingHttpHeaders, STATUS_CODES } from 'http'
import { net } from 'electron'
import { AddressInfo } from 'net'
import delivery from '../'
import { EventDeliveryPayload } from '@bugsnag/core/client'
import { Client } from '@bugsnag/core'
import PayloadQueue from '../queue'
import PayloadDeliveryLoop from '../payload-loop'
import { promises } from 'fs'
const { mkdtemp, rmdir } = promises

const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
}

const makeClient = (config: any = {}, logger: any = noopLogger) => {
  return { _config: config, _logger: logger } as unknown as Client
}

jest.mock('../queue')
jest.mock('../payload-loop')

const PayloadQueueMock = PayloadQueue as jest.MockedClass<typeof PayloadQueue>
const PayloadDeliveryLoopMock = PayloadDeliveryLoop as jest.MockedClass<typeof PayloadDeliveryLoop>

const mockServer = (statusCode = 200) => {
  const requests: Array<{ url?: string, method?: string, headers: IncomingHttpHeaders, body?: string }> = []
  return {
    requests,
    server: createServer((req, res) => {
      let body = ''
      req.on('data', (b: string) => { body += b })
      req.on('end', () => {
        requests.push({
          url: req.url,
          method: req.method,
          headers: req.headers,
          body
        })
        res.statusCode = statusCode
        res.end(STATUS_CODES[statusCode])
      })
    })
  }
}

describe('delivery: electron', () => {
  let enqueueSpy: jest.Mock
  let filestore: any

  beforeEach(async () => {
    const events = await mkdtemp('delivery-events-')
    const sessions = await mkdtemp('delivery-sessions-')
    filestore = {
      getPaths () {
        return { events: events, sessions: sessions }
      }
    }

    enqueueSpy = jest.fn().mockResolvedValue(true)

    PayloadQueueMock.mockImplementation(() => ({
      init: async () => await Promise.resolve(),
      enqueue: enqueueSpy
    } as any))
  })

  afterEach(async () => {
    const paths = filestore.getPaths()
    await rmdir(paths.events, { recursive: true })
    await rmdir(paths.sessions, { recursive: true })
  })

  it('sends events successfully', done => {
    const { requests, server } = mockServer()
    server.listen((err: any) => {
      expect(err).toBeUndefined()

      const payload = {
        events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
      } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://localhost:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      delivery(filestore, net)(makeClient(config)).sendEvent(payload, (err: any) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/notify/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-integrity']).toEqual('sha1 cd37120ed61291163a4f01d085a845bfeab9b56e')
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
    server.listen((err: any) => {
      expect(err).toBeUndefined()

      const payload = {
        events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
      } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: 'blah', sessions: `http://localhost:${(server.address() as AddressInfo).port}/sessions/` },
        redactedKeys: []
      }
      delivery(filestore, net)(makeClient(config)).sendSession(payload, (err: any) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/sessions/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-integrity']).toEqual('sha1 cd37120ed61291163a4f01d085a845bfeab9b56e')
        expect(requests[0].headers['bugsnag-payload-version']).toEqual('1')
        expect(requests[0].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(requests[0].body).toBe(JSON.stringify(payload))

        server.close()
        done()
      })
    })
  })

  it('handles errors gracefully (ECONNREFUSED)', done => {
    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
    } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://localhost:9999/notify/' },
      redactedKeys: []
    }
    let didLog = false
    const logger = { error: () => { didLog = true }, info: () => {} }
    delivery(filestore, net)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(enqueueSpy).toHaveBeenCalledWith(

        {
          opts: {
            url: 'http://localhost:9999/notify/',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Bugsnag-Api-Key': 'aaaaaaaa',
              'Bugsnag-Integrity': expect.stringContaining('sha1 '),
              'Bugsnag-Payload-Version': '4',
              'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
            }
          },
          body: expect.stringContaining('foo is not a function')
        },
        expect.any(Function)
      )
      done()
    })
  })

  it('handles errors gracefully (400)', done => {
    const { requests, server } = mockServer(400)
    server.listen((err: any) => {
      expect(err).toBeUndefined()

      const payload = {
        events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
      } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://localhost:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const logger = { error: () => { didLog = true }, info: () => {} }
      delivery(filestore, net)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
        expect(didLog).toBe(true)
        expect(enqueueSpy).not.toHaveBeenCalled()
        expect(err).toBeTruthy()
        expect(requests.length).toBe(1)
        server.close()
        done()
      })
    })
  })

  it('handles errors gracefully for sessions (ECONNREFUSED)', done => {
    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
    } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { sessions: 'http://localhost:9999/sessions/' },
      redactedKeys: []
    }
    let didLog = false
    const logger = { error: () => { didLog = true }, info: () => {} }
    delivery(filestore, net)(makeClient(config, logger)).sendSession(payload, (err: any) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(enqueueSpy).toHaveBeenCalledWith(
        {
          opts: {
            url: 'http://localhost:9999/sessions/',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Bugsnag-Api-Key': 'aaaaaaaa',
              'Bugsnag-Integrity': expect.stringContaining('sha1 '),
              'Bugsnag-Payload-Version': '1',
              'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
            }
          },
          body: expect.stringContaining('foo is not a function')
        },
        expect.any(Function)
      )
      done()
    })
  })

  it('handles errors gracefully (socket hang up)', done => {
    const server = createServer((req, res) => {
      req.connection.destroy()
    })

    server.listen((err: any) => {
      expect(err).toBeFalsy()
      const payload = {
        events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
      } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://localhost:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const logger = { error: () => { didLog = true }, info: () => {} }
      delivery(filestore, net)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(enqueueSpy).toHaveBeenCalled()

        server.close()
        done()
      })
    })
  })

  it('handles errors gracefully (HTTP 503)', done => {
    const server = createServer((req, res) => {
      res.statusCode = 503
      res.end('NOT OK')
    })

    server.listen((err: any) => {
      expect(err).toBeFalsy()
      const payload = {
        events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
      } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://localhost:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const logger = { error: () => { didLog = true }, info: () => {} }
      delivery(filestore, net)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(enqueueSpy).toHaveBeenCalled()

        server.close()
        done()
      })
    })
  })

  it('does not send an event marked with event.attemptImmediateDelivery=false', done => {
    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }],
      attemptImmediateDelivery: false
    } as unknown as EventDeliveryPayload
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'https://some-address.com' },
      redactedKeys: []
    }
    delivery(filestore, net)(makeClient(config)).sendEvent(payload, (err: any) => {
      expect(err).not.toBeTruthy()
      expect(enqueueSpy).toHaveBeenCalled()
      done()
    })
  })

  it('starts the redelivery loop if there is a connection', done => {
    PayloadDeliveryLoopMock.mockImplementation(() => ({
      start: () => {
        done()
      }
    } as any))

    delivery(filestore, net)(makeClient())
  })
})
