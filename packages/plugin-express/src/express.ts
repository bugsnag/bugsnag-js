import type { Client, Plugin } from '@bugsnag/core'
import { cloneClient } from '@bugsnag/core'
import { AsyncLocalStorage } from 'async_hooks'
import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import * as express from 'express'
import extractRequestInfo from './request-info'
import type { RequestInfo } from './request-info'

// Extend Express Request interface to include bugsnag client
declare module 'express-serve-static-core' {
  interface Request {
    bugsnag?: Client
  }
}

// Add getPlugin method type augmentation
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'express'): BugsnagPluginExpressResult | undefined
  }
}

interface BugsnagPluginExpressResult {
  errorHandler: ErrorRequestHandler
  requestHandler: express.RequestHandler
  runInContext: express.RequestHandler
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
  severity: 'error' as const,
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware' as const,
    attributes: { framework: 'Express/Connect' }
  }
}

const plugin: Plugin = {
  name: 'express',
  load: (client: Client): BugsnagPluginExpressResult => {
    const internalClient = client as InternalClient
    const requestHandler = (req: Request, res: Response, next: NextFunction) => {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = cloneClient(internalClient)
      if (requestClient._config.autoTrackSessions) {
        requestClient.startSession()
      }

      // attach it to the request
      req.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { metadata, request } = getRequestAndMetadataFromReq(req)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
        if (event._handledState.severityReason.type === 'unhandledException') {
          event.severity = 'error';
          (event as any)._handledState = handledState
        }
      }, true)

      internalClient._clientContext.run(requestClient, next)
    }

    const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
      if (!internalClient._config.autoDetectErrors) return next(err)

      const event = internalClient.Event.create(err, false, handledState, 'express middleware', 1)

      const { metadata, request } = getRequestAndMetadataFromReq(req)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)

      if (req.bugsnag) {
        req.bugsnag._notify(event)
      } else {
        internalClient._logger.warn(
          'req.bugsnag is not defined. Make sure the @bugsnag/plugin-express requestHandler middleware is added first.'
        )
        internalClient._notify(event)
      }

      next(err)
    }

    const runInContext = (req: Request, res: Response, next: NextFunction) => {
      (client as InternalClient)._clientContext.run(req.bugsnag as Client, next)
    }

    return { requestHandler, errorHandler, runInContext }
  }
}

const getRequestAndMetadataFromReq = (req: Request): ExtractedRequestData => {
  const { body, ...requestInfo } = extractRequestInfo(req as Request)
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
module.exports = plugin