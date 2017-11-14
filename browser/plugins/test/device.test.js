// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../device')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: device', () => {
  it('should add a beforeSend callback which captures device information', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    expect(client.config.beforeSend.length).toBe(1)

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].device).toBeDefined()
    expect(payloads[0].events[0].device.time).toMatch(ISO_8601)
    expect(payloads[0].events[0].device.locale).toBe(
      navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || navigator.language
    )
    expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
  })
})
