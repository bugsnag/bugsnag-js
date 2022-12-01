import payload from '@bugsnag/core/lib/json-payload'

type DeliveryCallback = (err?: Error | null) => void

export default (client: any) => ({
  sendEvent: (event: any, cb: DeliveryCallback = () => { }) => {
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
      cb(err)
    }).then(() => {
      cb(null)
    })
  },
  sendSession: (session: any, cb: DeliveryCallback = () => { }) => {
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
      cb(err)
    }).then(() => {
      cb(null)
    })
  }
})
