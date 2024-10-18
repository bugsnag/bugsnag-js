import Client from '@bugsnag/core/client'
import { schema } from '@bugsnag/core/config'
import plugin from '../'
import EventWithInternals from '@bugsnag/core/event'

describe('plugin: node unhandled rejection handler', () => {
  it('should listen to the process#unhandledRejection event', () => {
    const before = process.listeners('unhandledRejection').length
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    const after = process.listeners('unhandledRejection').length
    expect(before < after).toBe(true)
    expect(c).toBe(c)
    plugin.destroy()
  })

  it('does not add a process#unhandledRejection listener if autoDetectErrors=false', () => {
    const before = process.listeners('unhandledRejection').length
    const c = new Client({ apiKey: 'api_key', autoDetectErrors: false, plugins: [plugin] })
    const after = process.listeners('unhandledRejection').length
    expect(c).toBe(c)
    expect(after).toBe(before)
  })

  it('does not add a process#unhandledRejection listener if enabledErrorTypes.unhandledRejections=false', () => {
    const before = process.listeners('unhandledRejection').length
    const c = new Client({
      apiKey: 'api_key',
      enabledErrorTypes: { unhandledExceptions: false, unhandledRejections: false },
      plugins: [plugin]
    })
    const after = process.listeners('unhandledRejection').length
    expect(c).toBe(c)
    expect(after).toBe(before)
  })

  it('should call the configured onUnhandledRejection callback', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUnhandledRejection: (err: Error, event: EventWithInternals) => {
        expect(err.message).toBe('never gonna catch me')
        expect(event.errors[0].errorMessage).toBe('never gonna catch me')
        expect(event._handledState.unhandled).toBe(true)
        expect(event._handledState.severity).toBe('error')
        expect(event._handledState.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
        plugin.destroy()
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      onUnhandledRejection: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => cb(),
      sendSession: (payload, cb) => cb()
    }))
    process.listeners('unhandledRejection')[0](new Error('never gonna catch me'), Promise.resolve())
  })

  it('should report unhandledRejection events as handled when reportUnhandledPromiseRejectionsAsHandled is true', (done) => {
    const c = new Client({
      apiKey: 'api_key',
      reportUnhandledPromiseRejectionsAsHandled: true,
      onUnhandledRejection: (err: Error, event: EventWithInternals) => {
        expect(err.message).toBe('never gonna catch me')
        expect(event._handledState.unhandled).toBe(false)
        expect(event._handledState.severity).toBe('error')
        expect(event._handledState.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
        plugin.destroy()
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      onUnhandledRejection: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => cb(),
      sendSession: (payload, cb) => cb()
    }))
    process.listeners('unhandledRejection')[0](new Error('never gonna catch me'), Promise.resolve())
  })

  it('should tolerate delivery errors', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUnhandledRejection: (err: Error, event: EventWithInternals) => {
        expect(err.message).toBe('never gonna catch me')
        expect(event.errors[0].errorMessage).toBe('never gonna catch me')
        expect(event._handledState.unhandled).toBe(true)
        expect(event._handledState.severity).toBe('error')
        expect(event._handledState.severityReason).toEqual({ type: 'unhandledPromiseRejection' })
        plugin.destroy()
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      onUnhandledRejection: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => cb(new Error('floop')),
      sendSession: (payload, cb) => cb()
    }))
    process.listeners('unhandledRejection')[0](new Error('never gonna catch me'), Promise.resolve())
  })

  it('should return a promise that resolves after the onUnhandledRejection callback is called', async () => {
    try {
      const options = {
        apiKey: 'api_key',
        onUnhandledRejection: jest.fn(),
        plugins: [plugin]
      }

      const pluginSchema = {
        ...schema,
        onUnhandledRejection: {
          validate: (val: unknown) => typeof val === 'function',
          message: 'should be a function',
          defaultValue: () => {}
        }
      }

      const client = new Client(options, pluginSchema)

      client._setDelivery(client => ({
        sendEvent: (payload, cb) => cb(),
        sendSession: (payload, cb) => cb()
      }))

      const listener = process.listeners('unhandledRejection')[0]

      expect(options.onUnhandledRejection).not.toHaveBeenCalled()

      await listener(new Error('never gonna catch me'), Promise.resolve())

      expect(options.onUnhandledRejection).toHaveBeenCalledTimes(1)
    } finally {
      plugin.destroy()
    }
  })

  it('should prepend its listener (Node 6+)', async () => {
    // Skip this test on Node 4/5 as prependListener doesn't exist
    if (process.version.startsWith('v4.') || process.version.startsWith('v5.')) {
      return
    }

    const listener = () => {}

    try {
      process.on('unhandledRejection', listener)

      const listenersBefore = process.listeners('unhandledRejection')

      expect(listenersBefore).toHaveLength(1)
      expect(listenersBefore[0]).toBe(listener)

      const options = {
        apiKey: 'api_key',
        onUnhandledRejection: jest.fn(),
        plugins: [plugin]
      }

      const pluginSchema = {
        ...schema,
        onUnhandledRejection: {
          validate: (val: unknown) => typeof val === 'function',
          message: 'should be a function',
          defaultValue: () => {}
        }
      }

      const client = new Client(options, pluginSchema)

      client._setDelivery(client => ({
        sendEvent: (payload, cb) => cb(),
        sendSession: (payload, cb) => cb()
      }))

      const listenersAfter = process.listeners('unhandledRejection')

      expect(listenersAfter).toHaveLength(2)
      expect(listenersAfter[0]).not.toBe(listener)
      expect(listenersAfter[1]).toBe(listener)
    } finally {
      process.removeListener('unhandledRejection', listener)
      plugin.destroy()
    }
  })
})
