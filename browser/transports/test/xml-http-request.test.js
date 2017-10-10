// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const transport = require('../../transports/xml-http-request')

if (!('XDomainRequest' in window)) {
  describe('transport:XMLHttpRequest', () => {
    it('sends successfully', done => {
      const payload = { sample: 'payload' }
      transport.sendReport({ endpoint: '/echo' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
  })
}
