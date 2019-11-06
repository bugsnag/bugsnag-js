const { describe, it, expect } = global

const Client = require('@bugsnag/core/client')
const schema = require('@bugsnag/core/config').schema
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const plugin = require('../')

describe('plugin: node uncaught exception handler', () => {
  it('should listen to the process#uncaughtException event', () => {
    const before = process.listeners('uncaughtException').length
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    const after = process.listeners('uncaughtException').length
    expect(after - before).toBe(1)
    plugin.destroy()
  })

  it('does not add a process#uncaughtException listener when autoNotify=false', () => {
    const before = process.listeners('uncaughtException').length
    const c = new Client({ apiKey: 'api_key', autoDetectErrors: false }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    const after = process.listeners('uncaughtException').length
    expect(after).toBe(before)
  })

  it('should call the configured onUncaughtException callback', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: (err, event) => {
        expect(err.message).toBe('never gonna catch me')
        expect(event.errors[0].errorMessage).toBe('never gonna catch me')
        expect(event._handledState.unhandled).toBe(true)
        expect(event._handledState.severity).toBe('error')
        expect(event._handledState.severityReason).toEqual({ type: 'unhandledException' })
        plugin.destroy()
        done()
      }
    }, {
      ...schema,
      onUncaughtException: {
        validate: val => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    }, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (...args) => args[args.length - 1](),
      sendSession: (...args) => args[args.length - 1]()
    }))
    c.use(plugin)
    process.listeners('uncaughtException')[1](new Error('never gonna catch me'))
  })

  it('should tolerate delivery errors', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: (err, event) => {
        expect(err.message).toBe('never gonna catch me')
        expect(event.errors[0].errorMessage).toBe('never gonna catch me')
        expect(event._handledState.unhandled).toBe(true)
        expect(event._handledState.severity).toBe('error')
        expect(event._handledState.severityReason).toEqual({ type: 'unhandledException' })
        plugin.destroy()
        done()
      }
    }, {
      ...schema,
      onUncaughtException: {
        validate: val => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    }, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (...args) => args[args.length - 1](new Error('failed')),
      sendSession: (...args) => args[args.length - 1]()
    }))
    c.use(plugin)
    process.listeners('uncaughtException')[1](new Error('never gonna catch me'))
  })
})
