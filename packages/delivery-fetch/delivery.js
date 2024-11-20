import payload from '@bugsnag/core/lib/json-payload'

function getIntegrityHeaderValue (sendPayloadChecksums, windowOrWorkerGlobalScope, requestBody, headers) {
  if (sendPayloadChecksums && windowOrWorkerGlobalScope.isSecureContext && windowOrWorkerGlobalScope.crypto && windowOrWorkerGlobalScope.crypto.subtle && windowOrWorkerGlobalScope.crypto.subtle.digest && typeof TextEncoder === 'function') {
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

const delivery = (client, fetch = global.fetch, windowOrWorkerGlobalScope = window) => ({
  sendEvent: (event, cb = () => {}) => {
    const url = client._config.endpoints.notify

    const body = payload.event(event, client._config.redactedKeys)

    getIntegrityHeaderValue(client._config.sendPayloadChecksums, windowOrWorkerGlobalScope, body).then(integrityHeaderValue => {
      const headers = {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': event.apiKey || client._config.apiKey,
        'Bugsnag-Payload-Version': '4',
        'Bugsnag-Sent-At': (new Date()).toISOString()
      }

      if (integrityHeaderValue) {
        headers['Bugsnag-Integrity'] = integrityHeaderValue
      }

      return fetch(url, {
        method: 'POST',
        headers,
        body
      })
    }).then(() => {
      cb(null)
    }).catch(err => {
      client._logger.error(err)
      cb(err)
    })
  },
  sendSession: (session, cb = () => { }) => {
    const url = client._config.endpoints.sessions

    const body = payload.session(session, client._config.redactedKeys)

    getIntegrityHeaderValue(client._config.sendPayloadChecksums, windowOrWorkerGlobalScope, body).then((integrityHeaderValue) => {
      const headers = {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': client._config.apiKey,
        'Bugsnag-Payload-Version': '1',
        'Bugsnag-Sent-At': (new Date()).toISOString()
      }

      if (integrityHeaderValue) {
        headers['Bugsnag-Integrity'] = integrityHeaderValue
      }

      return fetch(url, {
        method: 'POST',
        headers,
        body
      })
    }).then(() => {
      cb(null)
    }).catch(err => {
      client._logger.error(err)
      cb(err)
    })
  }
})

export default delivery
