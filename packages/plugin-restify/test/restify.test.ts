import { Client, Event } from '@bugsnag/core'
import plugin from '../src/restify'

describe('plugin: restify', () => {
  it('exports two middleware functions', () => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const middleware = c.getPlugin('restify')!
    expect(typeof middleware.requestHandler).toBe('function')
    expect(middleware.requestHandler.length).toBe(3)
    expect(typeof middleware.errorHandler).toBe('function')
    expect(middleware.errorHandler.length).toBe(4)
  })

  it('proves that readonly _handledState properties can be modified individually', () => {
    const originalHandledState = {
      unhandled: false,
      severity: 'warning',
      severityReason: { type: 'handledException' }
    }

    const newHandledState = {
      unhandled: true,
      severity: 'error',
      severityReason: { type: 'unhandledErrorMiddleware', attributes: { framework: 'Restify' } }
    }

    const event = new (Event as any)('TestError', 'Test message', [], originalHandledState)

    expect(event._handledState.unhandled).toBe(false)
    expect(event._handledState.severity).toBe('warning')
    expect(event._handledState.severityReason.type).toBe('handledException')

    event._handledState.severity = newHandledState.severity
    event._handledState.unhandled = newHandledState.unhandled
    event._handledState.severityReason = newHandledState.severityReason

    expect(event._handledState.unhandled).toBe(true)
    expect(event._handledState.severity).toBe('error')
    expect(event._handledState.severityReason.type).toBe('unhandledErrorMiddleware')
    expect(event._handledState.severityReason.attributes.framework).toBe('Restify')
  })
})
