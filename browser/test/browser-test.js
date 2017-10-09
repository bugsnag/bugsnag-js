// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

const transports = {
  'XMLHttpRequest': require('../transports/xml-http-request'),
  'XDomainRequest': require('../transports/x-domain-request')
}

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

describe('transports', () => {
  if ('XDomainRequest' in window) {
    it('sends successfully with XDomainRequest transport', done => {
      const payload = { sample: 'payload' }
      transports.XDomainRequest.sendReport({ endpoint: '/echo' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
  } else {
    it('sends successfully with XMLHttpRequest transport', done => {
      const payload = { sample: 'payload' }
      transports.XMLHttpRequest.sendReport({ endpoint: '/echo' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
  }
})
