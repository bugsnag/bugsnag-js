const makePayload = require('./lib/payload')
const jsonStringify = require('fast-safe-stringify')
const { isoDate } = require('../../base/lib/es-utils')

module.exports = {
  name: 'XDomainRequest',
  sendReport: (logger, config, report, cb = () => {}) => {
    const url = `${config.endpoint}?apiKey=${encodeURIComponent(config.apiKey)}&payloadVersion=4.0&sentAt=${encodeURIComponent(isoDate())}`
    const req = new window.XDomainRequest()
    req.onload = function () {
      cb(null, req.responseText)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(makePayload(report))
      } catch (e) {
        logger.error(e)
      }
    }, 0)
  },
  sendSession: (logger, config, session, cb = () => {}) => {
    const url = `${config.sessionEndpoint}?apiKey=${encodeURIComponent(config.apiKey)}&payloadVersion=1.0&sentAt=${encodeURIComponent(isoDate())}`
    const req = new window.XDomainRequest()
    req.onload = function () {
      cb(null, req.responseText)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(jsonStringify(session))
      } catch (e) {
        logger.error(e)
      }
    }, 0)
  }
}
