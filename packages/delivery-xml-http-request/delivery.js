const payload = require('@bugsnag/core/lib/json-payload')

function getIntegrity (windowOrWorkerGlobalScope, requestBody) {
  if (windowOrWorkerGlobalScope.isSecureContext && windowOrWorkerGlobalScope.crypto && windowOrWorkerGlobalScope.crypto.subtle && windowOrWorkerGlobalScope.crypto.subtle.digest && typeof TextEncoder === 'function') {
    const msgUint8 = new TextEncoder().encode(requestBody)

    return windowOrWorkerGlobalScope.crypto.subtle.digest('SHA-1', msgUint8).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      return 'sha1 ' + hashHex
    })
  }
  return Promise.resolve()
}

module.exports = (client, win = window) => ({
  sendEvent: (event, cb = () => {}) => {
    try {
      const url = client._config.endpoints.notify
      if (url === null) {
        const err = new Error('Event not sent due to incomplete endpoint configuration')
        return cb(err)
      }
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
      if (url.substring(0, 5) === 'https') {
        req.setRequestHeader('Access-Control-Max-Age', 86400)
      }

      if (typeof Promise !== 'undefined') {
        getIntegrity(win, body).then((integrity) => {
          if (integrity) {
            req.setRequestHeader('Bugsnag-Integrity', integrity)
          }
        }).catch((err) => {
          client._logger.error(err)
        }).finally(() => {
          req.send(body)
        })
      } else {
        req.send(body)
      }
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
