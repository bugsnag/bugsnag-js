const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const request = require('./request')

module.exports = (client) => ({
  sendReport: (report, cb = () => {}) => {
    try {
      request({
        url: client.config.endpoints.notify,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': report.apiKey || client.config.apiKey,
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.report(report, client.config.filters),
        agent: client.config.agent
      }, (err, body) => {
        if (err) client._logger.error('Report failed to send…', err)
        cb(err)
      })
    } catch (e) {
      client._logger.error(e)
      cb(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    try {
      request({
        url: client.config.endpoints.sessions,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': client.config.apiKey,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.session(session, client.config.filters),
        agent: client.config.agent
      }, err => {
        if (err) client._logger.error('Session failed to send…', err)
        cb(err)
      })
    } catch (e) {
      client._logger.error(e)
      cb(e)
    }
  }
})
