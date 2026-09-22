import http from 'http'
import delivery from '../src/delivery'
import type {
  Client,
  EventDeliveryPayload,
  SessionDeliveryPayload
} from '@bugsnag/core'
import type { AddressInfo } from 'net'

interface Request {
  url?: string
  method?: string
  headers: http.IncomingHttpHeaders
  body: string
}

interface TestLogger {
  error: jest.Mock
  warn: jest.Mock
  info: jest.Mock
}

const createLogger = (): TestLogger => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
})

const createClient = (config: any, logger = createLogger()): Client =>
  ({
    _logger: logger,
    _config: config
  } as unknown as Client)

const listen = (server: http.Server): Promise<void> =>
  new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off('listening', onListening)
      reject(error)
    }

    const onListening = () => {
      server.off('error', onError)
      resolve()
    }

    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(0, '127.0.0.1')
  })

const close = (server: http.Server): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve()
      return
    }

    server.close(error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

const getServerUrl = (server: http.Server, path: string): string => {
  const address = server.address() as AddressInfo
  return `http://127.0.0.1:${address.port}${path}`
}

const sendEvent = (
  client: Client,
  payload: EventDeliveryPayload
): Promise<Error | null> =>
  new Promise(resolve => {
    delivery(client).sendEvent(payload, error => {
      resolve(error)
    })
  })

const sendSession = (
  client: Client,
  payload: SessionDeliveryPayload
): Promise<Error | null> =>
  new Promise(resolve => {
    delivery(client).sendSession(payload, error => {
      resolve(error)
    })
  })

const mockServer = (successCode = 200) => {
  const requests: Request[] = []

  const server = http.createServer((req, res) => {
    let body = ''

    req.on('data', chunk => {
      body += chunk
    })

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

  return {
    requests,
    server
  }
}

describe('delivery:node', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends events successfully', async () => {
    const { requests, server } = mockServer()

    await listen(server)

    try {
      const payload = {
        sample: 'payload'
      } as unknown as EventDeliveryPayload

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: {
          notify: getServerUrl(server, '/notify/'),
          sessions: null
        },
        redactedKeys: []
      }

      const error = await sendEvent(
        createClient(config),
        payload
      )

      expect(error).toBeNull()
      expect(requests).toHaveLength(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch('/notify/')
      expect(requests[0].headers['content-type']).toEqual('application/json')
      expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
      expect(requests[0].headers['bugsnag-payload-version']).toEqual('4')
      expect(requests[0].headers['bugsnag-sent-at']).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
      expect(requests[0].body).toBe(JSON.stringify(payload))
    } finally {
      await close(server)
    }
  })

  it('prevents event delivery with incomplete config', async () => {
    const { requests, server } = mockServer()

    await listen(server)

    try {
      const payload = {
        sample: 'payload'
      } as unknown as EventDeliveryPayload

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: {
          notify: null,
          sessions: null
        },
        redactedKeys: []
      }

      const error = await sendEvent(
        createClient(config),
        payload
      )

      expect(error).toStrictEqual(
        new Error(
          'Event not sent due to incomplete endpoint configuration'
        )
      )
      expect(requests).toHaveLength(0)
    } finally {
      await close(server)
    }
  })

  it('logs failures and large payloads', async () => {
    const { server } = mockServer(400)

    await listen(server)

    try {
      const lotsOfEvents: any[] = []

      while (JSON.stringify(lotsOfEvents).length < 10e5) {
        lotsOfEvents.push({
          errors: [
            {
              errorClass: 'Error',
              errorMessage: 'long repetitive string'.repeat(1000)
            }
          ]
        })
      }

      const payload = {
        events: lotsOfEvents
      } as unknown as EventDeliveryPayload

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: {
          notify: getServerUrl(server, '/notify/'),
          sessions: null
        },
        redactedKeys: []
      }

      const logger = createLogger()

      const error = await sendEvent(
        createClient(config, logger),
        payload
      )

      expect(error).toStrictEqual(
        new Error('Bad statusCode from API: 400\nOK')
      )

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Event failed to send…'),
        expect.any(Error)
      )

      expect(logger.warn).toHaveBeenCalledWith(
        'Event oversized (1.01 MB)'
      )
    } finally {
      await close(server)
    }
  })

  it('sends sessions successfully', async () => {
    const { requests, server } = mockServer(202)

    await listen(server)

    try {
      const payload = {
        sample: 'payload'
      } as unknown as SessionDeliveryPayload

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: {
          notify: null,
          sessions: getServerUrl(server, '/sessions/')
        },
        redactedKeys: []
      }

      const error = await sendSession(
        createClient(config),
        payload
      )

      expect(error).toBeNull()
      expect(requests).toHaveLength(1)
      expect(requests[0].method).toBe('POST')
      expect(requests[0].url).toMatch('/sessions/')
      expect(requests[0].headers['content-type']).toEqual('application/json')
      expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
      expect(requests[0].headers['bugsnag-payload-version']).toEqual('1')
      expect(requests[0].headers['bugsnag-sent-at']).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
      expect(requests[0].body).toBe(JSON.stringify(payload))
    } finally {
      await close(server)
    }
  })

  it('handles errors gracefully (ECONNREFUSED)', async () => {
    const payload = {
      sample: 'payload'
    } as unknown as EventDeliveryPayload

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        notify: 'http://127.0.0.1:1/notify/',
        sessions: null
      },
      redactedKeys: []
    }

    const logger = createLogger()

    const error = await sendEvent(
      createClient(config, logger),
      payload
    ) as NodeJS.ErrnoException

    expect(logger.error).toHaveBeenCalled()
    expect(error).toBeTruthy()
    expect(error.code).toBe('ECONNREFUSED')
  })

  it('handles errors gracefully (socket hang up)', async () => {
    const server = http.createServer(req => {
      req.destroy()
    })

    await listen(server)

    try {
      const payload = {
        sample: 'payload'
      } as unknown as EventDeliveryPayload

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: {
          notify: getServerUrl(server, '/notify/'),
          sessions: null
        },
        redactedKeys: []
      }

      const logger = createLogger()

      const error = await sendEvent(
        createClient(config, logger),
        payload
      ) as NodeJS.ErrnoException

      expect(logger.error).toHaveBeenCalled()
      expect(error).toBeTruthy()
      expect(error.code).toBe('ECONNRESET')
    } finally {
      await close(server)
    }
  })

  it('handles errors gracefully (HTTP 503)', async () => {
    const server = http.createServer((req, res) => {
      res.statusCode = 503
      res.end('NOT OK')
    })

    await listen(server)

    try {
      const payload = {
        sample: 'payload'
      } as unknown as EventDeliveryPayload

      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: {
          notify: getServerUrl(server, '/notify/'),
          sessions: null
        },
        redactedKeys: []
      }

      const logger = createLogger()

      const error = await sendEvent(
        createClient(config, logger),
        payload
      )

      expect(logger.error).toHaveBeenCalled()
      expect(error).toBeTruthy()
    } finally {
      await close(server)
    }
  })
})