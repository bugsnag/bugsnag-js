const payload = require('@bugsnag/core/lib/json-payload')

module.exports = (client, win = window) => ({
  sendEvent: (event, cb = () => {}) => {
    if (client._config.endpoints.notify === null) {
      const err = new Error('Event not sent due to incomplete endpoint configuration')
      return cb(err)
    }

    const url = getApiUrl(client._config, 'notify', '4', win)
    const req = new win.XDomainRequest()
    req.onload = function () {
      cb(null)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(payload.event(event, client._config.redactedKeys))
      } catch (e) {
        client._logger.error(e)
        cb(e)
      }
    }, 0)
  },
  sendSession: (session, cb = () => {}) => {
    if (client._config.endpoints.sessions === null) {
      const err = new Error('Session not sent due to incomplete endpoint configuration')
      return cb(err)
    }

    const url = getApiUrl(client._config, 'sessions', '1', win)
    const req = new win.XDomainRequest()
    req.onload = function () {
      cb(null)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(payload.session(session, client._config.redactedKeys))
      } catch (e) {
        client._logger.error(e)
        cb(e)
      }
    }, 0)
  }
})

const getApiUrl = (config, endpoint, version, win) => {
  // IE8 doesn't support Date.prototype.toISOstring(), but it does convert a date
  // to an ISO string when you use JSON stringify. Simply parsing the result of
  // JSON.stringify is smaller than using a toISOstring() polyfill.
  const isoDate = JSON.parse(JSON.stringify(new Date()))
  const url = matchPageProtocol(config.endpoints[endpoint], win.location.protocol)
  return `${url}?apiKey=${encodeURIComponent(config.apiKey)}&payloadVersion=${version}&sentAt=${encodeURIComponent(isoDate)}`
}

const matchPageProtocol = module.exports._matchPageProtocol = (endpoint, pageProtocol) =>
  pageProtocol === 'http:'
    ? endpoint.replace(/^https:/, 'http:')
    : endpoint
