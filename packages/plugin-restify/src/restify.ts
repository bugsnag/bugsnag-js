import type { Client, Plugin } from '@bugsnag/core'
import { cloneClient } from '@bugsnag/core'
import { AsyncLocalStorage } from 'async_hooks'
import type { Next, Request, Response } from 'restify'
import restify from 'restify'
import type { RequestInfo } from './request-info'
import extractRequestInfo from './request-info'

declare module 'restify' {
  interface Request {
    bugsnag?: Client
  }
}

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
  errorHandler: (req: restify.Request, res: restify.Response, err: RestifyError, cb: Next) => void
}

interface ExtractedRequestData {
  metadata: Omit<RequestInfo, 'body'>
  request: {
    body: RequestInfo['body']
    clientIp: RequestInfo['clientIp']
    headers: RequestInfo['headers']
    httpMethod: RequestInfo['httpMethod']
    url: RequestInfo['url']
    referer: RequestInfo['referer']
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

    const requestHandler: restify.RequestHandler = (req: Request, res: Response, next: Next) => {
      const requestClient = cloneClient(internalClient)
      if (requestClient._config.autoTrackSessions) {
        requestClient.startSession()
      }

      req.bugsnag = requestClient

      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromReq(req)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)

        if (event._handledState.severityReason.type === 'unhandledException') {
          ;(event as typeof event & { _handledState: typeof handledState })._handledState = handledState
        }
      }, true)

      internalClient._clientContext.run(requestClient, next)
    }

    const errorHandler = (req: Request, res: Response, err: RestifyError, cb: Next): void => {
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
  const { body, ...requestInfo } = extractRequestInfo(req)

  return {
    metadata: requestInfo,
    request: {
      body,
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      url: requestInfo.url,
      referer: requestInfo.referer
    }
  }
}

export default plugin