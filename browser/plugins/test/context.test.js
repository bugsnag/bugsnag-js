// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../context')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: context', () => {
  it('sets client.context (and report.context) to window.location.pathname', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].context).toBe(window.location.pathname)
  })

  it('sets doesn’t overwrite an existing context', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    client.context = 'something else'

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].context).toBe('something else')
  })
})
