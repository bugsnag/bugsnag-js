import type { Client, Config } from '@bugsnag/core'

import payload from '@bugsnag/core/lib/json-payload'
import { Event } from '@bugsnag/core'
import ClientWithInternals, { Delivery } from '@bugsnag/core/client'


function getIntegrityHeaderValue (windowOrWorkerGlobalScope: Window, requestBody: string) {
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

const delivery = (client: Client, win = window): Delivery => ({
  sendEvent: (event, cb = () => {}) => {
    const config = (client as ClientWithInternals<Required<Config>>)._config
    const logger = (client as ClientWithInternals)._logger

    try {
      const url = config.endpoints.notify
      if (url === null) {
        const err = new Error('Event not sent due to incomplete endpoint configuration')
        return cb(err)
      }
      const req = new win.XMLHttpRequest()
      const body = payload.event(event as unknown as Event, config.redactedKeys)

      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) {
          const status = req.status
          if (status === 0 || status >= 400) {
            const err = new Error(`Request failed with status ${status}`);
            logger.error('Event failed to send…', err)
            if (body.length > 10e5) {
              logger.warn(`Event oversized (${(body.length / 10e5).toFixed(2)} MB)`)
            }
            cb(err)
          } else {
            cb(null)
          }
        }
      }

      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', event.apiKey || config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '4')
      req.setRequestHeader('Bugsnag-Sent-At', (new Date()).toISOString())

      if (config.sendPayloadChecksums && typeof Promise !== 'undefined' && Promise.toString().indexOf('[native code]') !== -1) {
        getIntegrityHeaderValue(win, body).then((integrity) => {
          if (integrity) {
            req.setRequestHeader('Bugsnag-Integrity', integrity)
          }
          req.send(body)
        }).catch((err) => {
          logger.error(err)
          req.send(body)
        })
      } else {
        req.send(body)
      }
    } catch (e) {
      logger.error(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    const config = (client as ClientWithInternals<Required<Config>>)._config
    const logger = (client as ClientWithInternals)._logger

    try {
      const url = config.endpoints.sessions
      if (url === null) {
        const err = new Error('Session not sent due to incomplete endpoint configuration')
        return cb(err)
      }
      const req = new win.XMLHttpRequest()
      const body = payload.session(session, config.redactedKeys)

      req.onreadystatechange = function () {
        if (req.readyState === win.XMLHttpRequest.DONE) {
          const status = req.status
          if (status === 0 || status >= 400) {
            const err = new Error(`Request failed with status ${status}`);
            logger.error('Session failed to send…', err)
            cb(err)
          } else {
            cb(null)
          }
        }
      }

      req.open('POST', url)
      req.setRequestHeader('Content-Type', 'application/json')
      req.setRequestHeader('Bugsnag-Api-Key', config.apiKey)
      req.setRequestHeader('Bugsnag-Payload-Version', '1')
      req.setRequestHeader('Bugsnag-Sent-At', (new Date()).toISOString())

      if (config.sendPayloadChecksums && typeof Promise !== 'undefined' && Promise.toString().indexOf('[native code]') !== -1) {
        getIntegrityHeaderValue(win, body).then((integrity) => {
          if (integrity) {
            req.setRequestHeader('Bugsnag-Integrity', integrity)
          }
          req.send(body)
        }).catch((err) => {
          logger.error(err)
          req.send(body)
        })
      } else {
        req.send(body)
      }
    } catch (e) {
      logger.error(e)
    }
  }
})

export default delivery
