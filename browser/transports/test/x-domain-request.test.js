// magical jasmine globals
const { describe, it, expect } = global

const transport = require('../../transports/x-domain-request')

if ('XDomainRequest' in window) {
  describe('transport:XDomainRequest', () => {
    it('sends successfully', done => {
      const payload = { sample: 'payload' }
      transport.sendReport({}, { endpoint: '/echo' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
  })
}
