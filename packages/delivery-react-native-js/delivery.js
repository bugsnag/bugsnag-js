const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')

module.exports = (fetch = global.fetch) => ({
  sendReport: (logger, config, report, cb = () => {}) => {
    const _cb = err => {
      if (err) logger.error(`Report failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    try {
      const opts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': report.apiKey || config.apiKey,
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.report(report, config.filters)
      }
      fetch(config.endpoints.notify, opts)
        .then(response => {
          return response.ok
            ? response.text()
            : Promise.reject(new Error('Request not successful'))
        })
        .then(() => _cb(null))
        .catch(err => _cb(err))
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
      const opts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': config.apiKey,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.session(session, config.filters)
      }
      fetch(config.endpoints.sessions, opts)
        .then(response => {
          return response.ok
            ? response.text()
            : Promise.reject(new Error('Request not successful'))
        })
        .then(() => _cb(null))
        .catch(err => _cb(err))
    } catch (e) {
      _cb(e)
    }
  }
})
