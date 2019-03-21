const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')

module.exports = (client, win = window) => ({
  sendReport: (report, cb = () => {}) => {
    const url = getApiUrl(client.config, 'notify', '4', win)
    const req = new win.XDomainRequest()
    req.onload = function () {
      cb(null)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(payload.report(report, client.config.filters))
      } catch (e) {
        client._logger.error(e)
        cb(e)
      }
    }, 0)
  },
  sendSession: (session, cb = () => {}) => {
    const url = getApiUrl(client.config, 'sessions', '1', win)
    const req = new win.XDomainRequest()
    req.onload = function () {
      cb(null)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(payload.session(session, client.config.filters))
      } catch (e) {
        this._logger.error(e)
        cb(e)
      }
    }, 0)
  }
})

const getApiUrl = (config, endpoint, version, win) =>
  `${matchPageProtocol(config.endpoints[endpoint], win.location.protocol)}?apiKey=${encodeURIComponent(config.apiKey)}&payloadVersion=${version}&sentAt=${encodeURIComponent(isoDate())}`

const matchPageProtocol = module.exports._matchPageProtocol = (endpoint, pageProtocol) =>
  pageProtocol === 'http:'
    ? endpoint.replace(/^https:/, 'http:')
    : endpoint
