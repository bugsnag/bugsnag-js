const makePayload = require('./lib/payload')
const jsonStringify = require('@bugsnag/safe-json-stringify')
const { isoDate } = require('../../base/lib/es-utils')

module.exports = {
  name: 'XDomainRequest',
  sendReport: (logger, config, report, cb = () => {}) => {
    const url = `${matchPageProtocol(config.endpoint, window.location.protocol)}?apiKey=${encodeURIComponent(config.apiKey)}&payloadVersion=4.0&sentAt=${encodeURIComponent(isoDate())}`
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
    const url = `${matchPageProtocol(config.sessionEndpoint, window.location.protocol)}?apiKey=${encodeURIComponent(config.apiKey)}&payloadVersion=1.0&sentAt=${encodeURIComponent(isoDate())}`
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

const matchPageProtocol = module.exports._matchPageProtocol = (endpoint, pageProtocol) =>
  pageProtocol === 'http:'
    ? endpoint.replace(/^https:/, 'http:')
    : endpoint
