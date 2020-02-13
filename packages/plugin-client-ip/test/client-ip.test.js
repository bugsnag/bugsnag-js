const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')

describe('plugin: ip', () => {
  it('does nothing when collectUserIp=true', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    const payloads = []
    client.use(plugin)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'), event => { event.request = { some: 'detail' } })

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ some: 'detail' })
  })

  it('doesn’t overwrite an existing user id', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    const payloads = []
    client.use(plugin)

    client._user = { id: 'foobar' }

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0]._user).toEqual({ id: 'foobar' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
  })

  it('overwrites a user id if it is explicitly `undefined`', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    const payloads = []
    client.use(plugin)

    client._user = { id: undefined }

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0]._user).toEqual({ id: '[REDACTED]' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
  })

  it('redacts user IP if none is provided', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    const payloads = []
    client.use(plugin)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0]._user).toEqual({ id: '[REDACTED]' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
  })
})
