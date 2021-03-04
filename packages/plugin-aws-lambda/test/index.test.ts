import util from 'util'
import BugsnagPluginAwsLambda from '../src/'
import Client, { EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core/client'

const createClient = (events: EventDeliveryPayload[], sessions: SessionDeliveryPayload[], config = {}) => {
  const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda], ...config })

  // a flush failure won't throw as we don't want to crash apps if delivery takes
  // too long. To avoid the unit tests passing when this happens, we make the logger
  // throw on any 'error' log call
  client._logger.error = (...args) => { throw new Error(util.format(args)) }

  client._delivery = {
    sendEvent (payload, cb = () => {}) {
      events.push(payload)
      cb()
    },
    sendSession (payload, cb = () => {}) {
      sessions.push(payload)
      cb()
    }
  }

  return client
}

const DEFAULT_REMAINING_MS = 250
let getRemainingTimeInMillis: jest.MockedFunction<() => number>

beforeEach(() => {
  getRemainingTimeInMillis = jest.fn()
    .mockReturnValueOnce(DEFAULT_REMAINING_MS)
    .mockReturnValueOnce(DEFAULT_REMAINING_MS / 2)
    .mockImplementationOnce(() => { throw new Error('unexpected call to "getRemainingTimeInMillis"') })
})

describe('plugin: aws lambda', () => {
  it('has a name', () => {
    expect(BugsnagPluginAwsLambda.name).toBe('awsLambda')

    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })
    const plugin = client.getPlugin('awsLambda')

    expect(plugin).toBeTruthy()
  })

  it('exports a "createHandler" function', () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })
    const plugin = client.getPlugin('awsLambda')

    expect(plugin).toMatchObject({ createHandler: expect.any(Function) })
  })

  it('adds the context as metadata', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = (event: any, context: any) => 'abc'

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(event, context)).toBe('abc')

    expect(client.getMetadata('AWS Lambda context')).toEqual(context)
  })

  it('logs an error if flush times out', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })
    client._logger.error = jest.fn()

    client._delivery = {
      sendEvent (payload, cb = () => {}) {
        setTimeout(cb, 250)
      },
      sendSession (payload, cb = () => {}) {
        setTimeout(cb, 250)
      }
    }

    const handler = () => {
      client.notify('hello')

      return 'abc'
    }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const timeoutError = new Error('flush timed out after 20ms')

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler({ flushTimeoutMs: 20 })
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(event, context)).toBe('abc')
    expect(client._logger.error).toHaveBeenCalledWith(`Delivery may be unsuccessful: ${timeoutError.message}`)
  })

  it('returns a wrapped handler that resolves to the original return value (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = () => 'abc'

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await handler()).toBe('abc')
    expect(await wrappedHandler(event, context)).toBe('abc')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('notifies when an error is thrown (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const error = new Error('oh no')
    const handler = (event: any, context: any) => { throw error }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(1)
    expect(events[0].events[0].errors[0].errorMessage).toBe(error.message)

    expect(sessions).toHaveLength(1)
  })

  it('does not notify when "autoDetectErrors" is false (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, { autoDetectErrors: false })

    const error = new Error('oh no')
    const handler = (event: any, context: any) => { throw error }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('does not notify when "unhandledExceptions" are disabled (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, { enabledErrorTypes: { unhandledExceptions: false } })

    const error = new Error('oh no')
    const handler = (event: any, context: any) => { throw error }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('returns a wrapped handler that resolves to the value passed to the callback (callback)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = (event: any, context: any, callback: any) => { callback(null, 'xyz') }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('xyz')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('notifies when an error is passed (callback)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const error = new Error('uh oh')
    const handler = (event: any, context: any, callback: any) => { callback(error, 'xyz') }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(1)
    expect(events[0].events[0].errors[0].errorMessage).toBe(error.message)

    expect(sessions).toHaveLength(1)
  })

  it('does not notify when "autoDetectErrors" is false (callback)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, { autoDetectErrors: false })

    const error = new Error('uh oh')
    const handler = (event: any, context: any, callback: any) => { callback(error, 'xyz') }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('does not notify when "unhandledExceptions" are disabled (callback)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, { enabledErrorTypes: { unhandledExceptions: false } })

    const error = new Error('uh oh')
    const handler = (event: any, context: any, callback: any) => { callback(error, 'xyz') }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('works when an async handler has the callback parameter', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (event: any, context: any, callback: any) => 'abcxyz'

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('abcxyz')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('works when an async handler has the callback parameter and calls it', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (event: any, context: any, callback: any) => { callback(null, 'abcxyz') }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('abcxyz')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('works when an async handler has the callback parameter and throws', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const error = new Error('abcxyz')
    const handler = async (event: any, context: any, callback: any) => { throw error }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(1)
    expect(events[0].events[0].errors[0].errorMessage).toBe(error.message)

    expect(sessions).toHaveLength(1)
  })

  it('works when an async handler has the callback parameter and calls it with an error', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const error = new Error('abcxyz')
    const handler = async (event: any, context: any, callback: any) => { callback(error) }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(events).toHaveLength(1)
    expect(events[0].events[0].errors[0].errorMessage).toBe(error.message)

    expect(sessions).toHaveLength(1)
  })

  it('will track sessions when "autoTrackSessions" is enabled', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []
    const client = createClient(events, sessions, { autoTrackSessions: true })

    const handler = () => 'abc'

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(event, context)).toBe('abc')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('will not track sessions when "autoTrackSessions" is disabled', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []
    const client = createClient(events, sessions, { autoTrackSessions: false })

    const handler = () => 'abc'

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(event, context)).toBe('abc')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)
  })

  it('notifies when it is close to timing out (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (event: any, context: any) => new Promise(resolve => {
      setTimeout(() => resolve('xyz'), DEFAULT_REMAINING_MS + 100)
    })

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual', getRemainingTimeInMillis }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('xyz')

    expect(events).toHaveLength(1)
    expect(events[0].events).toHaveLength(1)
    expect(events[0].events[0].errors).toHaveLength(1)
    expect(events[0].events[0].context).toBe('Lambda timeout approaching')

    const expectedError = {
      errorClass: 'LambdaTimeoutApproaching',
      errorMessage: `Lambda will timeout in ${DEFAULT_REMAINING_MS / 2}ms`,
      stacktrace: [],
      type: 'nodejs'
    }

    expect(events[0].events[0].errors[0]).toEqual(expectedError)

    expect(sessions).toHaveLength(1)
  })

  it('notifies when it is close to timing out (callback)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = (event: any, context: any, callback: any) => new Promise(resolve => {
      setTimeout(() => callback(null, 'xyz'), DEFAULT_REMAINING_MS + 100)
    })

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual', getRemainingTimeInMillis }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('xyz')

    expect(events).toHaveLength(1)
    expect(events[0].events).toHaveLength(1)
    expect(events[0].events[0].errors).toHaveLength(1)
    expect(events[0].events[0].context).toBe('Lambda timeout approaching')

    const expectedError = {
      errorClass: 'LambdaTimeoutApproaching',
      errorMessage: `Lambda will timeout in ${DEFAULT_REMAINING_MS / 2}ms`,
      stacktrace: [],
      type: 'nodejs'
    }

    expect(events[0].events[0].errors[0]).toEqual(expectedError)

    expect(sessions).toHaveLength(1)
  })

  it('uses the function name as the event context when present', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (event: any, context: any) => new Promise(resolve => {
      setTimeout(() => resolve('xyz'), DEFAULT_REMAINING_MS + 100)
    })

    const event = { very: 'eventy' }
    const context = { functionName: 'MyCoolAndGoodLambdaFunction', getRemainingTimeInMillis }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('xyz')

    expect(events).toHaveLength(1)
    expect(events[0].events[0].errors[0].errorClass).toBe('LambdaTimeoutApproaching')
    expect(events[0].events[0].errors[0].errorMessage).toBe(`Lambda will timeout in ${DEFAULT_REMAINING_MS / 2}ms`)
    expect(events[0].events[0].errors[0].stacktrace).toHaveLength(0)
    expect(events[0].events[0].context).toBe('MyCoolAndGoodLambdaFunction')

    expect(sessions).toHaveLength(1)
  })

  it('allows the "lambdaTimeoutNotifyMs" to be changed', async () => {
    // With 6 seconds remaining and a resolve timeout of 500ms, the timeout
    // warning will never be triggered unless the custom "lambdaTimeoutNotifyMs"
    // takes effect
    const superLongWaitMs = 6000
    const resolveTimeoutMs = 500
    const lambdaTimeoutNotifyMs = superLongWaitMs - (resolveTimeoutMs / 2)

    getRemainingTimeInMillis = jest.fn()
      .mockReturnValueOnce(superLongWaitMs)
      .mockReturnValueOnce(superLongWaitMs - lambdaTimeoutNotifyMs)
      .mockImplementationOnce(() => { throw new Error('unexpected call to "getRemainingTimeInMillis"') })

    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (event: any, context: any) => new Promise(resolve => {
      setTimeout(() => resolve('xyz'), resolveTimeoutMs)
    })

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual', getRemainingTimeInMillis }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler({ lambdaTimeoutNotifyMs })
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('xyz')

    expect(events).toHaveLength(1)
    expect(events[0].events).toHaveLength(1)
    expect(events[0].events[0].errors).toHaveLength(1)
    expect(events[0].events[0].context).toBe('Lambda timeout approaching')

    const expectedError = {
      errorClass: 'LambdaTimeoutApproaching',
      errorMessage: `Lambda will timeout in ${resolveTimeoutMs / 2}ms`,
      stacktrace: [],
      type: 'nodejs'
    }

    expect(events[0].events[0].errors[0]).toEqual(expectedError)

    expect(sessions).toHaveLength(1)
  })

  it('does not notify if "lambdaTimeoutNotifyMs" is 0', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (event: any, context: any) => new Promise(resolve => {
      setTimeout(() => resolve('xyz'), 100)
    })

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual', getRemainingTimeInMillis }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler({ lambdaTimeoutNotifyMs: 0 })
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    expect(await wrappedHandler(event, context)).toBe('xyz')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })
})
