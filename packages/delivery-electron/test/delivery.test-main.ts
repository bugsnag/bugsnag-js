import { createServer, IncomingHttpHeaders, STATUS_CODES } from 'http'
import { app, net } from 'electron'
import { AddressInfo } from 'net'
import delivery from '../'
import { EventDeliveryPayload } from '@bugsnag/core/client'
import { Client } from '@bugsnag/core'
import PayloadQueue from '../queue'
import PayloadDeliveryLoop from '../payload-loop'
import { mkdtemp, rm } from 'fs/promises'
import EventEmitter from 'events'

const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
}

const makeClient = (config: any = {}, logger: any = noopLogger) => {
  return {
    _config: config,
    _logger: logger,
    getPlugin: () => { return { emitter: new EventEmitter() } }
  } as unknown as Client
}

const nextTick = async () => new Promise(resolve => process.nextTick(resolve))

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
      init: async () => Promise.resolve(),
      enqueue: enqueueSpy
    } as any))
  })

  afterEach(async () => {
    const paths = filestore.getPaths()
    await rm(paths.events, { recursive: true })
    await rm(paths.sessions, { recursive: true })
  })

  it('sends events successfully', done => {
    const { requests, server } = mockServer()
    // @ts-expect-error the types for 'listen' don't include this overload
    server.listen(0, 'localhost', (err: any) => {
      expect(err).toBeUndefined()

      const payload = {
        events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
      } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://localhost:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }
      delivery(filestore, net, app)(makeClient(config)).sendEvent(payload, (err: any) => {
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
    // @ts-expect-error the types for 'listen' don't include this overload
    server.listen(0, 'localhost', (err: any) => {
      expect(err).toBeUndefined()

      const payload = {
        events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
      } as unknown as EventDeliveryPayload
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: 'blah', sessions: `http://localhost:${(server.address() as AddressInfo).port}/sessions/` },
        redactedKeys: []
      }
      delivery(filestore, net, app)(makeClient(config)).sendSession(payload, (err: any) => {
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
    delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
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
    // @ts-expect-error the types for 'listen' don't include this overload
    server.listen(0, 'localhost', (err: any) => {
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
      delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
        expect(didLog).toBe(true)
        expect(enqueueSpy).not.toHaveBeenCalled()
        expect(err).toBeTruthy()
        expect(requests.length).toBe(1)
        server.close()
        done()
      })
    })
  })

  it('does not attempt to re-send oversized payloads', done => {
    // A 401 is considered retryable but this will be override by the payload size check
    const { requests, server } = mockServer(401)
    server.listen(err => {
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
        endpoints: { notify: `http://localhost:${(server.address() as AddressInfo).port}/notify/` },
        redactedKeys: []
      }

      const logger = { error: jest.fn(), info: () => {}, warn: jest.fn() }
      delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('event failed to send…'),
          expect.stringContaining('Bad status code from API: 401')
        )
        expect(logger.warn).toHaveBeenCalledWith('Discarding over-sized event (1.01 MB) after failed delivery')
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
    delivery(filestore, net, app)(makeClient(config, logger)).sendSession(payload, (err: any) => {
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

    // @ts-expect-error the types for 'listen' don't include this overload
    server.listen(0, 'localhost', (err: any) => {
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
      delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
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

    // @ts-expect-error the types for 'listen' don't include this overload
    server.listen(0, 'localhost', (err: any) => {
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
      delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(enqueueSpy).toHaveBeenCalled()

        server.close()
        done()
      })
    })
  })

  it('ignores secondary request/response errors after a response is received', done => {
    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
    } as unknown as EventDeliveryPayload

    const err = new Error('Error after response received')

    // create a mock response object that emits an error event
    const response = {
      statusCode: 407,
      statusMessage: STATUS_CODES[407],
      on (_event: any, cb: any) {
        if (_event === 'error') {
          cb(err)
        }
      }
    }

    let requestErrorCallback: any = () => {}

    // create a mock net instance that will return a response and also emit errors
    const net = {
      request: (opts: any, responseCallback: any) => ({
        on (_event: any, cb: any) {
          if (_event === 'error') {
            requestErrorCallback = cb
          }
        },
        write () {},
        end () {
          responseCallback(response)
          requestErrorCallback(err)
        }
      })
    }

    const logger = { error: jest.fn(), info: jest.fn() }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://localhost:9999/events/' },
      redactedKeys: []
    }

    delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
      expect(err).toBe(err)
      expect(err.isRetryable).toBe(false)
      expect(logger.error).toHaveBeenCalledWith('event failed to send…\n', err.stack)
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(enqueueSpy).not.toHaveBeenCalled()

      done()
    })
  })

  it('handles uncaught exceptions during event delivery', done => {
    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
    } as unknown as EventDeliveryPayload
    const net = { request: () => { throw new Error('bad day') } }
    let didLog = false
    const logger = { error: () => { didLog = true }, info: () => {} }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://localhost:9999/events/' },
      redactedKeys: []
    }
    delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(enqueueSpy).toHaveBeenCalledWith(
        {
          opts: {
            url: 'http://localhost:9999/events/',
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
        expect.any(Function))
      done()
    })
  })

  it('handles uncaught exceptions during session delivery', done => {
    const payload = { sessions: [{}] } as unknown as EventDeliveryPayload
    const net = { request: () => { throw new Error('bad day') } }
    let didLog = false
    const logger = { error: () => { didLog = true }, info: () => {} }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { sessions: 'http://localhost:9999/sessions/' },
      redactedKeys: []
    }
    delivery(filestore, net, app)(makeClient(config, logger)).sendSession(payload, (err: any) => {
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
          body: expect.stringContaining('{"sessions"')
        },
        expect.any(Function))
      done()
    })
  })

  it('will not retry exceptions caused by req.write during event delivery', done => {
    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
    } as unknown as EventDeliveryPayload

    const writeError = new TypeError('no thanks')

    const net = {
      request: () => ({
        on (_event: any, _cb: any) {},
        write (_body: any) { throw writeError },
        end () {}
      })
    }

    const logger = { error: jest.fn(), info: jest.fn() }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://localhost:9999/events/' },
      redactedKeys: []
    }

    delivery(filestore, net, app)(makeClient(config, logger)).sendEvent(payload, (err: any) => {
      expect(err).toBe(writeError)
      expect(err.isRetryable).toBe(false)
      expect(logger.error).toHaveBeenCalledWith('event failed to send…\n', writeError.stack)
      expect(enqueueSpy).not.toHaveBeenCalled()

      done()
    })
  })

  it('will not retry exceptions caused by req.write during session delivery', done => {
    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }]
    } as unknown as EventDeliveryPayload

    const writeError = new TypeError('no thanks')

    const net = {
      request: () => ({
        on (_event: any, _cb: any) {},
        write (_body: any) { throw writeError },
        end () {}
      })
    }

    const logger = { error: jest.fn(), info: jest.fn() }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { sessions: 'http://localhost:9999/sessions/' },
      redactedKeys: []
    }

    delivery(filestore, net, app)(makeClient(config, logger)).sendSession(payload, (err: any) => {
      expect(err).toBe(writeError)
      expect(err.isRetryable).toBe(false)
      expect(logger.error).toHaveBeenCalledWith('session failed to send…\n', writeError.stack)
      expect(enqueueSpy).not.toHaveBeenCalled()

      done()
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
    delivery(filestore, net, app)(makeClient(config)).sendEvent(payload, (err: any) => {
      expect(err).not.toBeTruthy()
      expect(enqueueSpy).toHaveBeenCalled()
      done()
    })
  })

  it('starts the redelivery loop if there is a connection', done => {
    PayloadDeliveryLoopMock.mockImplementation(() => ({
      start: done,
      stop: () => {}
    } as any))

    const net = { online: true }
    delivery(filestore, net, app)(makeClient())
  })

  it('does not start the redelivery loop if there is no connection', done => {
    PayloadDeliveryLoopMock.mockImplementation(() => ({
      start: done.fail,
      stop: done
    } as any))

    const net = { online: false }
    delivery(filestore, net, app)(makeClient())
  })

  it('starts the redelivery loop when a connection becomes available', async () => {
    const start = jest.fn()
    const stop = jest.fn()

    PayloadDeliveryLoopMock.mockImplementation(() => ({ start, stop } as any))

    const net = { online: false }
    const client = makeClient()
    const emitter = new EventEmitter()
    client.getPlugin = (_name: string) => { return { emitter } }

    delivery(filestore, net, app)(client)

    emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)

    await nextTick()

    expect(start).toHaveBeenCalled()
    expect(stop).not.toHaveBeenCalled()
  })

  it('stops the redelivery loop when a connection is lost', async () => {
    const start = jest.fn()
    const stop = jest.fn()

    PayloadDeliveryLoopMock.mockImplementation(() => ({ start, stop } as any))

    const net = { online: true }
    const client = makeClient()
    const emitter = new EventEmitter()
    client.getPlugin = (_name: string) => { return { emitter } }

    delivery(filestore, net, app)(client)

    await nextTick()

    expect(start).toHaveBeenCalled()
    expect(stop).not.toHaveBeenCalled()

    emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)

    await nextTick()

    expect(start).toHaveBeenCalled()
    expect(stop).toHaveBeenCalled()
  })
})
