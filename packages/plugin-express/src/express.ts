import type { Client, Plugin } from '@bugsnag/core'
import { cloneClient } from '@bugsnag/core'
import type { AsyncLocalStorage } from 'async_hooks'
import type * as express from 'express'
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
  errorHandler: express.ErrorRequestHandler
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
    const requestHandler: express.RequestHandler = (req, res, next) => {
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
          event.severity = 'error'
          // @ts-expect-error override readonly property
          event._handledState = handledState
        }
      }, true)

      internalClient._clientContext.run(requestClient, next)
    }

    const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
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

    const runInContext: express.RequestHandler = (req, res, next) => {
      (client as InternalClient)._clientContext.run(req.bugsnag as Client, next)
    }

    return { requestHandler, errorHandler, runInContext }
  }
}

const getRequestAndMetadataFromReq = (req: express.Request): ExtractedRequestData => {
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
