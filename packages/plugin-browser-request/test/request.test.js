const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

const window = { location: { href: 'http://xyz.abc/foo/bar.html' } }

describe('plugin: request', () => {
  it('sets report.request to window.location.href', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin, window)

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ url: window.location.href })
  })

  it('sets doesn’t overwrite an existing request', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin, window)

    client.request = { url: 'foobar' }

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ url: 'foobar' })
  })
})
