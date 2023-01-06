import payload from '@bugsnag/core/lib/json-payload'

const delivery = (client, fetch = global.fetch) => ({
  sendEvent: (event, cb = () => {}) => {
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
    }).then(() => {
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
