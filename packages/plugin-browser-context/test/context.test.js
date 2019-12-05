const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')

const window = {
  location: {
    pathname: '/test-page.html'
  }
}

describe('plugin: context', () => {
  it('sets client.context (and event.context) to window.location.pathname', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    const payloads = []
    client.use(plugin, window)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].context).toBe(window.location.pathname)
  })

  it('sets doesn’t overwrite an existing context', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' })
    const payloads = []
    client.use(plugin, window)

    client.context = 'something else'

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].context).toBe('something else')
  })
})
