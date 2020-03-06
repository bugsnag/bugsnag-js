const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')

const window = { location: { href: 'http://xyz.abc/foo/bar.html' } }

describe('plugin: request', () => {
  it('sets event.request to window.location.href', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
    const payloads = []

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ url: window.location.href })
  })

  it('sets doesn’t overwrite an existing request', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
    const payloads = []

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'), event => {
      event.request.url = 'foobar'
    })

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ url: 'foobar' })
  })
})
