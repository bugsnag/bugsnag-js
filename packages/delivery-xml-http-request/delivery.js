const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')

module.exports = (client, win = window) => ({
  sendEvent: (report, cb = () => {}) => {
    try {
      const url = client._config.endpoints.notify
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', report.apiKey || client._config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '4')
      req.setRequestHeader('Bugsnag-Sent-At', isoDate())
      req.send(payload.event(report, client._config.redactedKeys))
    } catch (e) {
      client.__logger.error(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    try {
      const url = client._config.endpoints.sessions
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', client._config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '1')
      req.setRequestHeader('Bugsnag-Sent-At', isoDate())
      req.send(payload.session(session, client._config.redactedKeys))
    } catch (e) {
      client.__logger.error(e)
    }
  }
})
