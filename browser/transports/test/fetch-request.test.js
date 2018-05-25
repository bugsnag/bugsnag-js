// magical jasmine globals
const { describe, it, expect } = global

const transport = require('../../transports/fetch-request')

if (!('fetch' in window)) {
  describe('transport:fetch', () => {
    it('sends reports successfully', done => {
      const payload = { sample: 'payload' }
      transport.sendReport({}, { endpoint: '/echo' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
    it('sends sessions successfully', done => {
      const payload = { sample: 'payload' }
      transport.sendSession({}, { sessionEndpoint: '/echo' }, payload, (err, responseText) => {
        expect(err).toBe(null)
        expect(responseText).toBe(JSON.stringify(payload))
        done()
      })
    })
  })
}
