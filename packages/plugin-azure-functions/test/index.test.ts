import util from 'util'
import BugsnagPluginAzureFunctions from '../src/'
import Client, { EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core/client'

const createClient = (events: EventDeliveryPayload[], sessions: SessionDeliveryPayload[], config = {}) => {
  const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAzureFunctions], ...config })

  // @ts-ignore the following property is not defined on the public Event interface
  client.Event.__type = 'nodejs'

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

describe('plugin: azure functions', () => {
  it('has a name', () => {
    expect(BugsnagPluginAzureFunctions.name).toBe('azureFunctions')

    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAzureFunctions] })
    const plugin = client.getPlugin('azureFunctions')

    expect(plugin).toBeTruthy()
  })

  it('exports a "createHandler" function', () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAzureFunctions] })
    const plugin = client.getPlugin('azureFunctions')

    expect(plugin).toMatchObject({ createHandler: expect.any(Function) })
  })

  it('adds the context as metadata', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async (context: any) => 'abc'

    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(context)).toBe('abc')

    expect(client.getMetadata('Azure Function context')).toEqual(context)
  })

  it('logs an error if flush times out', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAzureFunctions] })
    client._logger.error = jest.fn()

    client._delivery = {
      sendEvent (payload, cb = () => {}) {
        setTimeout(cb, 250)
      },
      sendSession (payload, cb = () => {}) {
        setTimeout(cb, 250)
      }
    }

    const handler = async () => {
      client.notify('hello')

      return 'abc'
    }

    const context = { extremely: 'contextual' }

    const timeoutError = new Error('flush timed out after 20ms')

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler({ flushTimeoutMs: 20 })
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(context)).toBe('abc')
    expect(client._logger.error).toHaveBeenCalledWith(`Delivery may be unsuccessful: ${timeoutError.message}`)
  })

  it('returns a wrapped handler that resolves to the original return value (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const handler = async () => 'abc'

    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await handler()).toBe('abc')
    expect(await wrappedHandler(context)).toBe('abc')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('notifies when an error is thrown (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions)

    const error = new Error('oh no')
    const handler = async (context: any) => { throw error }

    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(context)).rejects.toThrow(error)

    expect(events).toHaveLength(1)
    expect(events[0].events[0].errors[0].errorMessage).toBe(error.message)

    expect(sessions).toHaveLength(1)
  })

  it('does not notify when "autoDetectErrors" is false (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, { autoDetectErrors: false })

    const error = new Error('oh no')
    const handler = async (context: any) => { throw error }

    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(context)).rejects.toThrow(error)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('does not notify when "unhandledExceptions" are disabled (async)', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []

    const client = createClient(events, sessions, { enabledErrorTypes: { unhandledExceptions: false } })

    const error = new Error('oh no')
    const handler = async (context: any) => { throw error }

    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)

    await expect(() => wrappedHandler(context)).rejects.toThrow(error)

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('will track sessions when "autoTrackSessions" is enabled', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []
    const client = createClient(events, sessions, { autoTrackSessions: true })

    const handler = async () => 'abc'

    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(context)).toBe('abc')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(1)
  })

  it('will not track sessions when "autoTrackSessions" is disabled', async () => {
    const events: EventDeliveryPayload[] = []
    const sessions: SessionDeliveryPayload[] = []
    const client = createClient(events, sessions, { autoTrackSessions: false })

    const handler = async () => 'abc'

    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('azureFunctions')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(context)).toBe('abc')

    expect(events).toHaveLength(0)
    expect(sessions).toHaveLength(0)
  })
})
