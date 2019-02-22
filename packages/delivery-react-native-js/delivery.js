const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')

module.exports = (client, fetch = global.fetch) => {
  return {
    sendReport: (report, cb = () => {}) => {
      const _cb = err => {
        if (err) client._logger.error(`Report failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
        cb(err)
      }

      try {
        const opts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': report.apiKey || client.config.apiKey,
            'Bugsnag-Payload-Version': '4',
            'Bugsnag-Sent-At': isoDate()
          },
          body: payload.report(report, client.config.filters)
        }
        fetch(client.config.endpoints.notify, opts)
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
    sendSession: (session, cb = () => {}) => {
      const _cb = err => {
        if (err) client._logger.error(`Session failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
        cb(err)
      }

      try {
        const opts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': client.config.apiKey,
            'Bugsnag-Payload-Version': '1',
            'Bugsnag-Sent-At': isoDate()
          },
          body: payload.session(session, client.config.filters)
        }
        fetch(client.config.endpoints.sessions, opts)
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
  }
}
