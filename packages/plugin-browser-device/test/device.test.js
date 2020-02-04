const { describe, it, expect } = global

const plugin = require('../device')

const Client = require('@bugsnag/core/client')

const navigator = { locale: 'en_GB', userAgent: 'testing browser 1.2.3' }

describe('plugin: device', () => {
  it('should add an onError callback which captures device information', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    const payloads = []
    client.use(plugin, navigator)

    expect(client._cbs.e.length).toBe(1)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].device).toBeDefined()
    expect(payloads[0].events[0].device.time instanceof Date).toBe(true)
    expect(payloads[0].events[0].device.locale).toBe(navigator.browserLanguage)
    expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
  })

  it('should add an onSession callback which captures device information', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    const payloads = []
    client._sessionDelegate = {
      startSession: (client, session) => {
        client._delivery.sendSession(session)
      }
    }
    client.use(plugin, navigator)

    expect(client._cbs.s.length).toBe(1)

    client._setDelivery(client => ({ sendSession: (payload) => payloads.push(payload) }))
    client.startSession()

    expect(payloads.length).toEqual(1)
    expect(payloads[0].device).toBeDefined()
    expect(payloads[0].device.locale).toBe(navigator.browserLanguage)
    expect(payloads[0].device.userAgent).toBe(navigator.userAgent)
  })
})
