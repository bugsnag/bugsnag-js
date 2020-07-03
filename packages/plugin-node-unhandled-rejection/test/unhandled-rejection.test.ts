import Client from '@bugsnag/core/client'
import { schema } from '@bugsnag/core/config'
import plugin from '../'

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
      onUnhandledRejection: (err, event) => {
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
        validate: val => typeof val === 'function',
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
      onUnhandledRejection: (err, event) => {
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
        validate: val => typeof val === 'function',
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
})
