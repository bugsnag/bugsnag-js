import BugsnagPluginAwsLambda from '../src/'
import Client, { EventDeliveryPayload } from '@bugsnag/core/client'

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
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })

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

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        setTimeout(cb, 250)
      },
      sendSession: () => {}
    }))

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
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })

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
  })

  it('notifies when an error is thrown (async)', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })
    const payloads: EventDeliveryPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        payloads.push(payload)
        cb()
      },
      sendSession: () => {}
    }))

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

    expect(payloads).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(payloads).toHaveLength(1)
    expect(payloads[0].events[0].errors[0].errorMessage).toBe(error.message)
  })

  it('returns a wrapped handler that resolves to the value passed to the callback (callback)', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })

    const handler = (event: any, context: any, callback: any) => { callback(null, 'xyz') }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(event, context)).toBe('xyz')
  })

  it('notifies when an error is passed (callback)', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })
    const payloads: EventDeliveryPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        payloads.push(payload)
        cb()
      },
      sendSession: () => {}
    }))

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

    expect(payloads).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(payloads).toHaveLength(1)
    expect(payloads[0].events[0].errors[0].errorMessage).toBe(error.message)
  })

  it('works when an async handler has the callback parameter', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })

    const handler = async (event: any, context: any, callback: any) => 'abcxyz'

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(event, context)).toBe('abcxyz')
  })

  it('works when an async handler has the callback parameter and calls it', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })

    const handler = async (event: any, context: any, callback: any) => { callback(null, 'abcxyz') }

    const event = { very: 'eventy' }
    const context = { extremely: 'contextual' }

    const plugin = client.getPlugin('awsLambda')

    if (!plugin) {
      throw new Error('Plugin was not loaded!')
    }

    const bugsnagHandler = plugin.createHandler()
    const wrappedHandler = bugsnagHandler(handler)

    expect(await wrappedHandler(event, context)).toBe('abcxyz')
  })

  it('works when an async handler has the callback parameter and throws', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })
    const payloads: EventDeliveryPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        payloads.push(payload)
        cb()
      },
      sendSession: () => {}
    }))

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

    expect(payloads).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(payloads).toHaveLength(1)
    expect(payloads[0].events[0].errors[0].errorMessage).toBe(error.message)
  })

  it('works when an async handler has the callback parameter and calls it with an error', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY', plugins: [BugsnagPluginAwsLambda] })
    const payloads: EventDeliveryPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        payloads.push(payload)
        cb()
      },
      sendSession: () => {}
    }))

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

    expect(payloads).toHaveLength(0)

    await expect(() => wrappedHandler(event, context)).rejects.toThrow(error)

    expect(payloads).toHaveLength(1)
    expect(payloads[0].events[0].errors[0].errorMessage).toBe(error.message)
  })
})
