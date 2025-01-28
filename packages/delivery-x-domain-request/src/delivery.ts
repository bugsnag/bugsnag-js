/* eslint-disable import/no-duplicates */
import payload from '@bugsnag/core/lib/json-payload'

import { Client, Config, Event, Session } from '@bugsnag/core'
import getApiUrl from './get-api-url'
import matchPageProtocol from './match-page-protocol'

import type ClientWithInternals from '@bugsnag/core/client'
import type { Delivery } from '@bugsnag/core/client'

const delivery = (client: Client, win = window): Delivery => ({
  sendEvent: (event, cb = () => {}) => {
    if ((client as ClientWithInternals)._config.endpoints?.notify === null) {
      const err = new Error('Event not sent due to incomplete endpoint configuration')
      return cb(err)
    }

    const url = getApiUrl((client as ClientWithInternals<Required<Config>>)._config, 'notify', '4', win)
    const body = payload.event(event as unknown as Event, (client as ClientWithInternals<Required<Config>>)._config.redactedKeys)

    // @ts-expect-error XDomainRequest is not defined in the Window interface
    const req = new win.XDomainRequest()
    req.onload = function () {
      cb(null)
    }
    req.onerror = function () {
      const err = new Error('Event failed to send');
      (client as ClientWithInternals)._logger.error('Event failed to send…', err)
      if (body.length > 10e5) {
        (client as ClientWithInternals)._logger.warn(`Event oversized (${(body.length / 10e5).toFixed(2)} MB)`)
      }
      cb(err)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(body)
      } catch (e) {
        (client as ClientWithInternals)._logger.error(e)
        if (e instanceof Error || e === undefined || e === null) {
          cb(e)
        }
      }
    }, 0)
  },
  sendSession: (session, cb = () => {}) => {
    if ((client as ClientWithInternals<Required<Config>>)._config.endpoints.sessions === null) {
      const err = new Error('Session not sent due to incomplete endpoint configuration')
      return cb(err)
    }

    const url = getApiUrl((client as ClientWithInternals<Required<Config>>)._config, 'sessions', '1', win)
    // @ts-expect-error XDomainRequest is not defined in the Window interface
    const req = new win.XDomainRequest()
    req.onload = function () {
      cb(null)
    }
    req.open('POST', url)
    setTimeout(() => {
      try {
        req.send(payload.session(session as Session, (client as ClientWithInternals<Required<Config>>)._config.redactedKeys))
      } catch (e) {
        (client as ClientWithInternals)._logger.error(e)
        if (e instanceof Error || e === undefined || e === null) {
          cb(e)
        }
      }
    }, 0)
  }
})

delivery._matchPageProtocol = matchPageProtocol

export default delivery
