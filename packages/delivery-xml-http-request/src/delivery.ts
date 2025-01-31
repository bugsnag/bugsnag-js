import type { Client, Config, Session } from '@bugsnag/core'

import payload from '@bugsnag/core/lib/json-payload'
import { Event } from '@bugsnag/core'
import ClientWithInternals, { Delivery } from '@bugsnag/core/client'

const delivery = (client: Client, win = window): Delivery => ({
  sendEvent: (event, cb = () => {}) => {
    try {
      const url = (client as ClientWithInternals<Required<Config>>)._config.endpoints.notify
      if (url === null) {
        const err = new Error('Event not sent due to incomplete endpoint configuration')
        return cb(err)
      }
      const req = new win.XMLHttpRequest()
      const body = payload.event(event as unknown as Event, (client as ClientWithInternals<Required<Config>>)._config.redactedKeys)

      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) {
          const status = req.status
          if (status === 0 || status >= 400) {
            const err = new Error(`Request failed with status ${status}`);
            (client as ClientWithInternals)._logger.error('Event failed to send…', err)
            if (body.length > 10e5) {
              (client as ClientWithInternals)._logger.warn(`Event oversized (${(body.length / 10e5).toFixed(2)} MB)`)
            }
            cb(err)
          } else {
            cb(null)
          }
        }
      }

      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', event.apiKey || (client as ClientWithInternals)._config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '4')
      req.setRequestHeader('Bugsnag-Sent-At', (new Date()).toISOString())
      req.send(body)
    } catch (e) {
      (client as ClientWithInternals)._logger.error(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    try {
      const url = (client as ClientWithInternals<Required<Config>>)._config.endpoints.sessions
      if (url === null) {
        const err = new Error('Session not sent due to incomplete endpoint configuration')
        return cb(err)
      }
      const req = new win.XMLHttpRequest()

      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) {
          const status = req.status
          if (status === 0 || status >= 400) {
            const err = new Error(`Request failed with status ${status}`);
            (client as ClientWithInternals)._logger.error('Session failed to send…', err)
            cb(err)
          } else {
            cb(null)
          }
        }
      }

      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', (client as ClientWithInternals)._config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '1')
      req.setRequestHeader('Bugsnag-Sent-At', (new Date()).toISOString())
      req.send(payload.session(session as Session, (client as ClientWithInternals<Required<Config>>)._config.redactedKeys))
    } catch (e) {
      (client as ClientWithInternals)._logger.error(e)
    }
  }
})

export default delivery
