const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')

module.exports = (client, win = window) => ({
  sendReport: (report, cb = () => {}) => {
    try {
      const url = client.config.endpoints.notify
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', report.apiKey || client.config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '4')
      req.setRequestHeader('Bugsnag-Sent-At', isoDate())
      req.send(payload.report(report, client.config.filters))
    } catch (e) {
      client._logger.error(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    try {
      const url = client.config.endpoints.sessions
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', client.config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '1')
      req.setRequestHeader('Bugsnag-Sent-At', isoDate())
      req.send(payload.session(session, client.config.filters))
    } catch (e) {
      client._logger.error(e)
    }
  }
})
