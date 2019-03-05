const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const queue = require('./queue')
const redelivery = require('./redelivery')

module.exports = (client, fetch = global.fetch) => {
  const send = (url, opts, cb) => {
    fetch(url, opts)
      .then(response => {
        if (response.ok) return response.text()
        const err = new Error(`Bad status code from API: ${response.status}`)
        err.isRetryable = response.status < 400 || response.status > 499
        return Promise.reject(err)
      })
      .then(() => cb(null))
      .catch(err => cb(err))
  }

  const logError = e => client._logger.error('Error redelivering payload', e)

  const onerror = (err, failedPayload, payloadKind, cb) => {
    client._logger.error(`${payloadKind} failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
    if (failedPayload && err.isRetryable !== false) {
      queue.enqueue({ ...failedPayload, retries: 0 }, logError)
    }
    cb(err)
  }

  // kick off the redelivery mechanism for undelivered payloads
  redelivery(send, queue, logError)

  return {
    sendReport: (report, cb = () => {}) => {
      const url = client.config.endpoints.notify

      let body, opts
      try {
        body = payload.report(report, client.config.filters)
        opts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': report.apiKey || client.config.apiKey,
            'Bugsnag-Payload-Version': '4',
            'Bugsnag-Sent-At': isoDate()
          },
          body
        }
        send(url, opts, err => {
          if (err) return onerror(err, { url, opts }, 'Report', cb)
          cb(null)
        })
      } catch (e) {
        onerror(e, { url, opts }, cb)
      }
    },
    sendSession: (session, cb = () => {}) => {
      const url = client.config.endpoints.sessions

      let body, opts
      try {
        body = payload.session(session, client.config.filters)
        opts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': client.config.apiKey,
            'Bugsnag-Payload-Version': '1',
            'Bugsnag-Sent-At': isoDate()
          },
          body
        }
        send(url, opts, err => {
          if (err) return onerror(err, { url, opts }, 'Session', cb)
          cb(null)
        })
      } catch (e) {
        onerror(e, { url, opts }, 'Session', cb)
      }
    }
  }
}
