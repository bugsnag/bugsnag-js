import payload from '@bugsnag/core/lib/json-payload'

async function addIntegrityHeader (windowOrWorkerGlobalScope, requestBody, headers) {
  if (windowOrWorkerGlobalScope.isSecureContext && windowOrWorkerGlobalScope.crypto && windowOrWorkerGlobalScope.crypto.subtle && windowOrWorkerGlobalScope.crypto.subtle.digest && typeof TextEncoder === 'function') {
    const msgUint8 = new TextEncoder().encode(requestBody)
    const hashBuffer = await windowOrWorkerGlobalScope.crypto.subtle.digest('SHA-1', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    headers['Bugsnag-Integrity'] = 'sha1 ' + hashHex
  }
}

const delivery = (client, fetch = global.fetch, windowOrWorkerGlobalScope = window) => ({
  sendEvent: (event, cb = () => {}) => {
    const url = client._config.endpoints.notify

    const body = payload.event(event, client._config.redactedKeys)
    const headers = {
      'Content-Type': 'application/json',
      'Bugsnag-Api-Key': event.apiKey || client._config.apiKey,
      'Bugsnag-Payload-Version': '4',
      'Bugsnag-Sent-At': (new Date()).toISOString()
    }

    addIntegrityHeader(windowOrWorkerGlobalScope, body, headers).then(() =>
      fetch(url, {
        method: 'POST',
        headers,
        body
      })
    ).then(() => {
      cb(null)
    }).catch(err => {
      client._logger.error(err)
      cb(err)
    })
  },
  sendSession: (session, cb = () => { }) => {
    const url = client._config.endpoints.sessions

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': client._config.apiKey,
        'Bugsnag-Payload-Version': '1',
        'Bugsnag-Sent-At': (new Date()).toISOString()
      },
      body: payload.session(session, client._config.redactedKeys)
    }).then(() => {
      cb(null)
    }).catch(err => {
      client._logger.error(err)
      cb(err)
    })
  }
})

export default delivery
