import type { Client, Plugin } from '@bugsnag/core'
import { cloneClient } from '@bugsnag/core'
import { AsyncLocalStorage } from 'async_hooks'
import type { Next, Request, Response } from 'restify'
import restify from 'restify'
import type { RequestInfo, RestifyRequest } from './request-info'
import extractRequestInfo from './request-info'

declare module 'restify' {
  interface Request {
    bugsnag?: Client
  }
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'restify'): BugsnagPluginRestifyResult | undefined
  }
}

interface RestifyError extends Error {
  statusCode?: number
}

interface BugsnagPluginRestifyResult {
  requestHandler: restify.RequestHandler
  errorHandler: (req: restify.Request, res: restify.Response, err: RestifyError, cb: (...args: any[]) => void) => void
}

interface ExtractedRequestData {
  metadata: Omit<RequestInfo, 'body'>
  request: {
    body?: Record<string, any>
    clientIp?: string
    headers: Record<string, any>
    httpMethod: string
    url: string
    referer?: string
  }
}

interface InternalClient extends Client {
  _clientContext: AsyncLocalStorage<Client>
}

const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware',
    attributes: { framework: 'Restify' }
  }
}

const plugin: Plugin = {
  name: 'restify',
  load: (client: Client): BugsnagPluginRestifyResult => {
    const internalClient = client as InternalClient

    const requestHandler = (req: Request, res: Response, next: Next) => {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = cloneClient(internalClient)
      if (requestClient._config.autoTrackSessions) {
        requestClient.startSession()
      }

      // attach it to the request
      req.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromReq(req)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
        if (event._handledState.severityReason.type === 'unhandledException') {
            (event as any)._handledState = handledState
        }
      }, true);

      internalClient._clientContext.run(requestClient, next)
    }

    const errorHandler = (req: Request, res: Response, err: RestifyError, cb: () => void) => {
      if (!internalClient._config.autoDetectErrors) return cb()
      if (err.statusCode && err.statusCode < 500) return cb()

      const event = internalClient.Event.create(err, false, handledState, 'restify middleware', 1)
      const { metadata, request } = getRequestAndMetadataFromReq(req)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)

      if (req.bugsnag) {
        req.bugsnag._notify(event)
      } else {
        internalClient._logger.warn(
          'req.bugsnag is not defined. Make sure the @bugsnag/plugin-restify requestHandler middleware is added first.'
        )
        internalClient._notify(event)
      }
      cb()
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetadataFromReq = (req: Request): ExtractedRequestData => {
  const { body, ...requestInfo } = extractRequestInfo(req as RestifyRequest)
  return {
    metadata: requestInfo,
    request: {
      body,
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      url: requestInfo.url,
      referer: requestInfo.referer // Not part of the notifier spec for request but leaving for backwards compatibility
    }
  }
}

export default plugin

module.exports = plugin
module.exports.default = plugin
