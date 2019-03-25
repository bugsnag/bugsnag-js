const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

const window = {
  location: {
    pathname: '/test-page.html'
  }
}

describe('plugin: context', () => {
  it('sets client.context (and report.context) to window.location.pathname', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin, window)

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].context).toBe(window.location.pathname)
  })

  it('sets doesn’t overwrite an existing context', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin, window)

    client.context = 'something else'

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].context).toBe('something else')
  })
})
