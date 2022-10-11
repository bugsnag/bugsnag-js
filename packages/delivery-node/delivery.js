const payload = require('@bugsnag/core/lib/json-payload')
const request = require('./request')

module.exports = (client) => ({
  sendEvent: (event, cb = () => {}) => {
    const _cb = err => {
      if (err) client._logger.error(`Event failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    if (client._config.endpoints.notify === null) {
      const err = new Error('Event not sent due to incomplete endpoint configuration')
      return _cb(err)
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
    const _cb = err => {
      if (err) client._logger.error(`Session failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    if (client._config.endpoints.session === null) {
      const err = new Error('Session not sent due to incomplete endpoint configuration')
      return _cb(err)
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
  }
})
