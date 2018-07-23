const jsonStringify = require('@bugsnag/safe-json-stringify')
const makePayload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const request = require('request')

module.exports = () => ({
  sendReport: (logger, config, report, cb = () => {}) => {
    try {
      request({
        method: 'POST',
        url: config.endpoints.notify,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': report.apiKey || config.apiKey,
          'Bugsnag-Payload-Version': '4.0',
          'Bugsnag-Sent-At': isoDate()
        },
        body: makePayload(report),
        proxy: config.proxy
      }, cb)
    } catch (e) {
      logger.error(e)
    }
  },
  sendSession: (logger, config, session, cb = () => {}) => {
    try {
      request({
        method: 'POST',
        url: config.endpoints.sessions,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': config.apiKey,
          'Bugsnag-Payload-Version': '1.0',
          'Bugsnag-Sent-At': isoDate()
        },
        body: jsonStringify(session),
        proxy: config.proxy
      }, cb)
    } catch (e) {
      logger.error(e)
    }
  }
})
