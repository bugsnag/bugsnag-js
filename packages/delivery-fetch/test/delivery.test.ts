import delivery from '../delivery'
import type {
  Client,
  EventDeliveryPayload,
  SessionDeliveryPayload
} from '@bugsnag/core'

const globalAny = global as any

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
})

const createClient = (
  config: Record<string, any>,
  logger = createLogger()
): Client =>
  ({
    _logger: logger,
    _config: config
  } as unknown as Client)

const mockSuccessfulFetch = () => {
  globalAny.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({})
  })
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

const setSecureContext = (value: boolean) => {
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value
  })
}

describe('delivery:fetch', () => {
  beforeEach(() => {
    setSecureContext(false)
    globalAny.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete globalAny.fetch
  })

  it('sends events successfully', async () => {
    setSecureContext(true)
    mockSuccessfulFetch()

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        notify: '/echo/'
      },
      redactedKeys: [],
      sendPayloadChecksums: true
    }

    const payload = {
      sample: 'payload'
    } as unknown as EventDeliveryPayload

    const error = await sendEvent(
      createClient(config),
      payload
    )

    expect(error).toBeNull()
    expect(globalAny.fetch).toHaveBeenCalledTimes(1)

    expect(globalAny.fetch).toHaveBeenCalledWith(
      '/echo/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'aaaaaaaa',
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          ),
          'Content-Type': 'application/json'
        })
      })
    )

    const requestOptions = globalAny.fetch.mock.calls[0][1]

    expect(requestOptions.headers['Bugsnag-Integrity']).toBeUndefined()
  })

  it('omits the bugsnag integrity header when not in a secure context', async () => {
    setSecureContext(false)
    mockSuccessfulFetch()

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        notify: '/echo/'
      },
      redactedKeys: [],
      sendPayloadChecksums: true
    }

    const payload = {
      sample: 'payload'
    } as unknown as EventDeliveryPayload

    const error = await sendEvent(
      createClient(config),
      payload
    )

    expect(error).toBeNull()
    expect(globalAny.fetch).toHaveBeenCalledTimes(1)

    const requestOptions = globalAny.fetch.mock.calls[0][1]

    expect(requestOptions.headers['Bugsnag-Integrity']).toBeUndefined()
  })

  it('omits the bugsnag integrity header when sendPayloadChecksums is false', async () => {
    setSecureContext(true)
    mockSuccessfulFetch()

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        notify: '/echo/'
      },
      redactedKeys: [],
      sendPayloadChecksums: false
    }

    const payload = {
      sample: 'payload'
    } as unknown as EventDeliveryPayload

    const error = await sendEvent(
      createClient(config),
      payload
    )

    expect(error).toBeNull()
    expect(globalAny.fetch).toHaveBeenCalledTimes(1)

    const requestOptions = globalAny.fetch.mock.calls[0][1]

    expect(requestOptions.headers['Bugsnag-Integrity']).toBeUndefined()
  })

  it('returns an error for failed event delivery', async () => {
    const deliveryError = new Error('failed to deliver')
    const mockError = jest.fn()

    globalAny.fetch = jest.fn().mockRejectedValue(deliveryError)

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        notify: '/echo/'
      },
      redactedKeys: []
    }

    const payload = {
      sample: 'payload'
    } as unknown as EventDeliveryPayload

    const error = await sendEvent(
      createClient(config, {
        info: jest.fn(),
        warn: jest.fn(),
        error: mockError
      }),
      payload
    )

    expect(error).toStrictEqual(deliveryError)
    expect(mockError).toHaveBeenCalledWith(deliveryError)
  })

  it('sends sessions successfully', async () => {
    setSecureContext(true)
    mockSuccessfulFetch()

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        sessions: '/echo/'
      },
      redactedKeys: [],
      sendPayloadChecksums: true
    }

    const payload = {
      sample: 'payload'
    } as unknown as SessionDeliveryPayload

    const error = await sendSession(
      createClient(config),
      payload
    )

    expect(error).toBeNull()
    expect(globalAny.fetch).toHaveBeenCalledTimes(1)

    expect(globalAny.fetch).toHaveBeenCalledWith(
      '/echo/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'aaaaaaaa',
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          ),
          'Content-Type': 'application/json'
        })
      })
    )

    const requestOptions = globalAny.fetch.mock.calls[0][1]

    expect(requestOptions.headers['Bugsnag-Integrity']).toBeUndefined()
  })

  it('returns an error for failed sessions', async () => {
    const deliveryError = new Error('failed to deliver')
    const mockError = jest.fn()

    globalAny.fetch = jest.fn().mockRejectedValue(deliveryError)

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        sessions: '/echo/'
      },
      redactedKeys: []
    }

    const payload = {
      sample: 'payload'
    } as unknown as SessionDeliveryPayload

    const error = await sendSession(
      createClient(config, {
        info: jest.fn(),
        warn: jest.fn(),
        error: mockError
      }),
      payload
    )

    expect(error).toStrictEqual(deliveryError)
    expect(mockError).toHaveBeenCalledWith(deliveryError)
  })

  it('prioritises API key set on an event', async () => {
    mockSuccessfulFetch()

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: {
        notify: '/echo/'
      },
      redactedKeys: []
    }

    const payload = {
      sample: 'payload',
      apiKey: 'bbbbbbbb'
    } as unknown as EventDeliveryPayload

    const error = await sendEvent(
      createClient(config),
      payload
    )

    expect(error).toBeNull()
    expect(globalAny.fetch).toHaveBeenCalledTimes(1)

    expect(globalAny.fetch).toHaveBeenCalledWith(
      '/echo/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'bbbbbbbb',
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          ),
          'Content-Type': 'application/json'
        })
      })
    )
  })
})