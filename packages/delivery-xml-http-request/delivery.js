const payload = require('@bugsnag/core/lib/json-payload')

module.exports = (client, win = window) => ({
  sendEvent: (event, cb = () => {}) => {
    try {
      const url = client._config.endpoints.notify
      const req = new win.XMLHttpRequest()
      const body = payload.event(event, client._config.redactedKeys)

      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) {
          const status = req.status
          if (status === 0 || status >= 400) {
            const err = new Error(`Request failed with status ${status}`)
            client._logger.error('Event failed to send…', err)
            if (body.length > 10e5) {
              client._logger.warn(`Event oversized (${(body.length / 10e5).toFixed(2)} MB)`)
            }
            cb(err)
          } else {
            cb(null)
          }
        }
      }

      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', event.apiKey || client._config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '4')
      req.setRequestHeader('Bugsnag-Sent-At', (new Date()).toISOString())
      req.send(body)
    } catch (e) {
      client._logger.error(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    try {
      const url = client._config.endpoints.sessions
      const req = new win.XMLHttpRequest()

      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) {
          const status = req.status
          if (status === 0 || status >= 400) {
            const err = new Error(`Request failed with status ${status}`)
            client._logger.error('Session failed to send…', err)
            cb(err)
          } else {
            cb(null)
          }
        }
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
