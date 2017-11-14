// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../request')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: request', () => {
  it('sets report.request to window.location.href', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ url: window.location.href })
  })

  it('sets doesn’t overwrite an existing request', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    client.request = { url: 'foobar' }

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ url: 'foobar' })
  })
})
