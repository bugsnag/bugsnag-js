const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const request = require('./request')

module.exports = () => ({
  sendReport: (logger, config, report, cb = () => {}) => {
    const _cb = err => {
      if (err) logger.error(`Report failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    try {
      request({
        url: config.endpoints.notify,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': report.apiKey || config.apiKey,
          'Bugsnag-Payload-Version': '4.0',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.report(report, config.filters),
        agent: config.agent
      }, (err, body) => _cb(err))
    } catch (e) {
      _cb(e)
    }
  },
  sendSession: (logger, config, session, cb = () => {}) => {
    const _cb = err => {
      if (err) logger.error(`Session failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    try {
      request({
        url: config.endpoints.sessions,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': config.apiKey,
          'Bugsnag-Payload-Version': '1.0',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.session(session, config.filters),
        agent: config.agent
      }, err => _cb(err))
    } catch (e) {
      _cb(e)
    }
  }
})
