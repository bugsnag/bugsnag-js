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
  describe('transport:XDomainRequest matchPageProtocol()', () => {
    it('should swap https: -> http: when the current protocol is http', () => {
      expect(
        transport._matchPageProtocol('https://notify.bugsnag.com/', 'http:')
      ).toBe('http://notify.bugsnag.com/')
    })
    it('should not swap https: -> http: when the current protocol is https', () => {
      expect(
        transport._matchPageProtocol('https://notify.bugsnag.com/', 'https:')
      ).toBe('https://notify.bugsnag.com/')
    })
  })
}
