const { describe, it, expect } = global

const Client = require('@bugsnag/core/client')
const schema = require('@bugsnag/core/config').schema
const plugin = require('../')

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
      sendEvent: (...args) => args[args.length - 1](),
      sendSession: (...args) => args[args.length - 1]()
    }))
    process.listeners('unhandledRejection')[1](new Error('never gonna catch me'))
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
      sendEvent: (...args) => args[args.length - 1](new Error('floop')),
      sendSession: (...args) => args[args.length - 1]()
    }))
    process.listeners('unhandledRejection')[1](new Error('never gonna catch me'))
  })
})
