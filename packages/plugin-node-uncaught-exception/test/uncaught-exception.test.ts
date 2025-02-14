import { Client, Event, schema } from '@bugsnag/core'
import plugin from '../'

describe('plugin: node uncaught exception handler', () => {
  it('should listen to the process#uncaughtException event', () => {
    const before = process.listeners('uncaughtException').length
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    const after = process.listeners('uncaughtException').length
    expect(after - before).toBe(1)
    expect(c).toBe(c)
    plugin.destroy()
  })

  it('does not add a process#uncaughtException listener when autoDetectErrors=false', () => {
    const before = process.listeners('uncaughtException').length
    const c = new Client({ apiKey: 'api_key', autoDetectErrors: false, plugins: [plugin] })
    const after = process.listeners('uncaughtException').length
    expect(after).toBe(before)
    expect(c).toBe(c)
  })

  it('does not add a process#uncaughtException listener when enabledErrorTypes.unhandledExceptions=false', () => {
    const before = process.listeners('uncaughtException').length
    const c = new Client({
      apiKey: 'api_key',
      enabledErrorTypes: { unhandledExceptions: false, unhandledRejections: true },
      plugins: [plugin]
    })
    const after = process.listeners('uncaughtException').length
    expect(after).toBe(before)
    expect(c).toBe(c)
  })

  it('should call the configured onUncaughtException callback', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: (err: Error, event: Event) => {
        expect(err.message).toBe('never gonna catch me')
        expect(event.errors[0].errorMessage).toBe('never gonna catch me')
        expect(event._handledState.unhandled).toBe(true)
        expect(event._handledState.severity).toBe('error')
        expect(event._handledState.severityReason).toEqual({ type: 'unhandledException' })
        plugin.destroy()
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      // @ts-ignore
      onUncaughtException: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => cb(),
      sendSession: (payload, cb) => cb()
    }))
    process.listeners('uncaughtException')[0](new Error('never gonna catch me'), 'uncaughtException')
  })

  it('should tolerate delivery errors', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: (err: Error, event: Event) => {
        expect(err.message).toBe('never gonna catch me')
        expect(event.errors[0].errorMessage).toBe('never gonna catch me')
        expect(event._handledState.unhandled).toBe(true)
        expect(event._handledState.severity).toBe('error')
        expect(event._handledState.severityReason).toEqual({ type: 'unhandledException' })
        plugin.destroy()
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      // @ts-ignore
      onUncaughtException: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => cb(new Error('failed')),
      sendSession: (payload, cb) => cb()
    }))
    process.listeners('uncaughtException')[0](new Error('never gonna catch me'), 'uncaughtException')
  })
})
