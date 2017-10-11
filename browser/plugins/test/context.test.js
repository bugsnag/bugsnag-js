// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../context')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: context', () => {
  it('should have a name and description', () => {
    expect(plugin.name).toBe('context')
    expect(plugin.description).toBeDefined()
  })

  it('sets client.context (and report.context) to window.location.pathname', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    expect(client.context).toBe(window.location.pathname)

    client.transport({ sendReport: (config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].context).toBe(window.location.pathname)
  })
})
