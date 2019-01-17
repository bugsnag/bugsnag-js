const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const request = require('./request')

module.exports = () => ({
  sendReport: (logger, config, report, cb = () => {}) => {
    try {
      request({
        url: config.endpoints.notify,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': report.apiKey || config.apiKey,
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.report(report, config.filters),
        agent: config.agent
      }, (err, body) => {
        if (err) logger.error('Report failed to send…', err)
        cb(err)
      })
    } catch (e) {
      logger.error(e)
      cb(e)
    }
  },
  sendSession: (logger, config, session, cb = () => {}) => {
    try {
      request({
        url: config.endpoints.sessions,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': config.apiKey,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.session(session, config.filters),
        agent: config.agent
      }, err => {
        if (err) logger.error('Session failed to send…', err)
        cb(err)
      })
    } catch (e) {
      logger.error(e)
      cb(e)
    }
  }
})
