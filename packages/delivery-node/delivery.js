const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const request = require('./request')

module.exports = (client) => ({
  sendReport: (report, cb = () => {}) => {
    const _cb = err => {
      if (err) client._logger.error(`Report failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

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
      }, (err, body) => _cb(err))
    } catch (e) {
      _cb(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    const _cb = err => {
      if (err) client._logger.error(`Session failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

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
      }, err => _cb(err))
    } catch (e) {
      _cb(e)
    }
  }
})
