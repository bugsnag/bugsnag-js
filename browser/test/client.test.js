// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('client()', () => {
  it('allows app { version, releaseStage } to be set', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.app = { version: '1.2.3', releaseStage: 'staging' }
    client.transport({ sendReport: (config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].app).toEqual({ version: '1.2.3', releaseStage: 'staging' })
  })

  it('allows app.version to be set', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.app.version = '1.2.3'
    client.transport({ sendReport: (config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].app).toEqual({ version: '1.2.3' })
  })

  it('allows app.releaseStage to be set', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.app.releaseStage = 'staging'
    client.transport({ sendReport: (config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].app).toEqual({ releaseStage: 'staging' })
  })
})
