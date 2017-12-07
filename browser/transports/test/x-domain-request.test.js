// magical jasmine globals
const { describe, it, expect } = global

const transport = require('../../transports/x-domain-request')

if ('XDomainRequest' in window) {
  describe('transport:XDomainRequest', () => {
    it('sends reports successfully', done => {
      const payload = { sample: 'payload' }
      transport.sendReport({}, { endpoint: '/echo/' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
    it('sends sessions successfully', done => {
      const payload = { sample: 'payload' }
      transport.sendSession({}, { sessionEndpoint: '/echo/' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
  })
}
