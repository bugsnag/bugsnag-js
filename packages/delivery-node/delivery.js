const payload = require('@bugsnag/core/lib/json-payload')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const request = require('./request')

module.exports = (client) => ({
  sendEvent: (event, cb = () => {}) => {
    const _cb = err => {
      if (err) client.__logger.error(`Report failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    try {
      request({
        url: client._config.endpoints.notify,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': event.apiKey,
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.event(event, client._config.redactedKeys),
        agent: client._config.agent
      }, (err, body) => _cb(err))
    } catch (e) {
      _cb(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    const _cb = err => {
      if (err) client.__logger.error(`Session failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    try {
      request({
        url: client._config.endpoints.sessions,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': client._config.apiKey,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': isoDate()
        },
        body: payload.session(session, client._config.redactedKeys),
        agent: client._config.agent
      }, err => _cb(err))
    } catch (e) {
      _cb(e)
    }
  }
})
