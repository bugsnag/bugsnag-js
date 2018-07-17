const jsonStringify = require('@bugsnag/safe-json-stringify')
const makePayload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')

module.exports = (win = window) => ({
  sendReport: (logger, config, report, cb = () => {}) => {
    try {
      const url = config.endpoints.notify
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', report.apiKey || config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '4.0')
      req.setRequestHeader('Bugsnag-Sent-At', isoDate())
      req.send(makePayload(report))
    } catch (e) {
      logger.error(e)
    }
  },
  sendSession: (logger, config, session, cb = () => {}) => {
    try {
      const url = config.endpoints.sessions
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '1.0')
      req.setRequestHeader('Bugsnag-Sent-At', isoDate())
      req.send(jsonStringify(session))
    } catch (e) {
      logger.error(e)
    }
  }
})
