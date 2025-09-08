import type { Client, Config, Delivery } from '@bugsnag/core'
import * as jsonPayload from '@bugsnag/json-payload'
import request from './request'
import http from 'http'

interface PluginConfig extends Config {
  agent?: http.Agent
}

interface InternalClient extends Client {
  _config: Required<PluginConfig>
}

const delivery = (client: Client): Delivery => ({
  sendEvent: (event, cb = () => {}) => {
    const internalClient = client as InternalClient
    const body = jsonPayload.event(event, internalClient._config.redactedKeys)

    const _cb = (err: Error | null) => {
      if (err) internalClient._logger.error(`Event failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      if (body.length > 10e5) {
        internalClient._logger.warn(`Event oversized (${(body.length / 10e5).toFixed(2)} MB)`)
      }
      cb(err)
    }

    if (internalClient._config.endpoints.notify === null) {
      const err = new Error('Event not sent due to incomplete endpoint configuration')
      return _cb(err)
    }

    try {
      request({
        url: internalClient._config.endpoints.notify,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': event.apiKey || internalClient._config.apiKey,
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': (new Date()).toISOString()
        },
        body,
        agent: internalClient._config.agent
      }, (err) => _cb(err))
    } catch (e: any) {
      _cb(e)
    }
  },
  sendSession: (session, cb = () => {}) => {
    const internalClient = client as InternalClient
    const _cb = (err: Error | null) => {
      if (err) internalClient._logger.error(`Session failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
      cb(err)
    }

    if (internalClient._config.endpoints.sessions === null) {
      const err = new Error('Session not sent due to incomplete endpoint configuration')
      return _cb(err)
    }

    try {
      request({
        url: internalClient._config.endpoints.sessions,
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': internalClient._config.apiKey,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': (new Date()).toISOString()
        },
        body: jsonPayload.session(session, internalClient._config.redactedKeys),
        agent: internalClient._config.agent
      }, err => _cb(err))
    } catch (e: any) {
      _cb(e)
    }
  }
})


export default delivery