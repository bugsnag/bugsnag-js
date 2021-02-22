const payload = require('@bugsnag/core/lib/json-payload')
const cuid = require('@bugsnag/cuid')
const request = require('./request')

const DEFAULT_FLUSH_TIMEOUT_MS = 2000
const FLUSH_POLL_INTERVAL_MS = 50

// this map holds requests that we have not got responses or errors from
const inFlightRequests = new Map()

module.exports = (client) => ({
  sendEvent: (event, cb = () => {}) => {
    // mark this request as in-flight
    const id = cuid()
    inFlightRequests.set(id, true)

    const _cb = err => {
      // this request has finished so remove it from the in-flight requests
      inFlightRequests.delete(id)

      if (err) client._logger.error(`Event failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    try {
      request({
        url: client._config.endpoints.notify,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': event.apiKey || client._config.apiKey,
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': (new Date()).toISOString()
        },
        body: payload.event(event, client._config.redactedKeys),
        agent: client._config.agent
      }, (err, body) => _cb(err))
    } catch (e) {
      _cb(e)
    }
  },

  sendSession: (session, cb = () => {}) => {
    // mark this request as in-flight
    const id = cuid()
    inFlightRequests.set(id, true)

    const _cb = err => {
      // this request has finished so remove it from the in-flight requests
      inFlightRequests.delete(id)

      if (err) client._logger.error(`Session failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    try {
      request({
        url: client._config.endpoints.sessions,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': client._config.apiKey,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': (new Date()).toISOString()
        },
        body: payload.session(session, client._config.redactedKeys),
        agent: client._config.agent
      }, err => _cb(err))
    } catch (e) {
      _cb(e)
    }
  },

  _flush: (timeoutMs = DEFAULT_FLUSH_TIMEOUT_MS) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => { reject(new Error(`_flush timed out after ${timeoutMs}ms`)) },
        timeoutMs
      )

      const resolveIfNoRequests = () => {
        if (inFlightRequests.size === 0) {
          clearTimeout(timeout)
          resolve()

          return
        }

        setTimeout(resolveIfNoRequests, FLUSH_POLL_INTERVAL_MS)
      }

      resolveIfNoRequests()
    })
  }
})
