// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('client()', () => {
  it('should successfully notify()', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.transport({ sendReport: (config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))
    expect(payloads.length).toEqual(1)
  })
})
