import payload from '@bugsnag/core/lib/json-payload'

export default (client: any) => ({
  sendEvent: (event: any, cb = () => {}) => {
    const url = client._config.endpoints.notify

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': client._config.apiKey,
        'Bugsnag-Payload-Version': '4',
        'Bugsnag-Sent-At': (new Date()).toISOString()
      },
      body: payload.event(event, client._config.redactedKeys)
    }).catch(err => {
      client._logger.error(err)
    })
  },
  sendSession: (session: any, cb = () => {}) => {
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
    }).catch(err => {
      client._logger.error(err)
    })
  }
})
