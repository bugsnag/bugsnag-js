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

    const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].device).toBeDefined()
    expect(payloads[0].events[0].device.time).toMatch(ISO_8601)
    expect(payloads[0].events[0].device.locale).toBe(navigator.browserLanguage)
    expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
  })
})
