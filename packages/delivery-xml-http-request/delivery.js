const payload = require('@bugsnag/core/lib/json-payload')

module.exports = (client, win = window) => ({
  sendEvent: (event, cb = () => {}) => {
    try {
      const url = client._config.endpoints.notify
      if (url === null) {
        const err = new Error('Event not sent due to incomplete endpoint configuration')
        return cb(err)
      }
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', event.apiKey || client._config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '4')
      req.setRequestHeader('Bugsnag-Sent-At', (new Date()).toISOString())
      req.send(payload.event(event, client._config.redactedKeys))
    } catch (e) {
      client._logger.error(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    try {
      const url = client._config.endpoints.sessions
      if (url === null) {
        const err = new Error('Session not sent due to incomplete endpoint configuration')
        return cb(err)
      }
      const req = new win.XMLHttpRequest()
      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) cb(null)
      }
      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', client._config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '1')
      req.setRequestHeader('Bugsnag-Sent-At', (new Date()).toISOString())
      req.send(payload.session(session, client._config.redactedKeys))
    } catch (e) {
      client._logger.error(e)
    }
  }
})
