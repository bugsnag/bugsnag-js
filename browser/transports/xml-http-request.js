const makePayload = require('./lib/payload')
const jsonStringify = require('@bugsnag/safe-json-stringify')
const { isoDate } = require('../../base/lib/es-utils')

module.exports = {
  name: 'XMLHttpRequest',
  sendReport: (logger, config, report, cb = () => {}) => {
    const url = config.endpoint
    const req = new window.XMLHttpRequest()
    req.onreadystatechange = function () {
      if (req.readyState === window.XMLHttpRequest.DONE) cb(null, req.responseText)
    }
    req.open('POST', url)
    req.setRequestHeader('Content-Type', 'application/json')
    req.setRequestHeader('Bugsnag-Api-Key', report.apiKey || config.apiKey)
    req.setRequestHeader('Bugsnag-Payload-Version', '4.0')
    req.setRequestHeader('Bugsnag-Sent-At', isoDate())
    try {
      req.send(makePayload(report))
    } catch (e) {
      logger.error(e)
    }
  },
  sendSession: (logger, config, session, cb = () => {}) => {
    const url = config.sessionEndpoint
    const req = new window.XMLHttpRequest()
    req.onreadystatechange = function () {
      if (req.readyState === window.XMLHttpRequest.DONE) cb(null, req.responseText)
    }
    req.open('POST', url)
    req.setRequestHeader('Content-Type', 'application/json')
    req.setRequestHeader('Bugsnag-Api-Key', config.apiKey)
    req.setRequestHeader('Bugsnag-Payload-Version', '1.0')
    req.setRequestHeader('Bugsnag-Sent-At', isoDate())
    try {
      req.send(jsonStringify(session))
    } catch (e) {
      logger.error(e)
    }
  }
}
