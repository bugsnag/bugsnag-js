import { Client, cloneClient, Plugin } from '@bugsnag/core'
import { AsyncLocalStorage } from 'async_hooks'
import * as Koa from 'koa'
import extractRequestInfo from './request-info'

interface BugsnagPluginKoaResult {
  errorHandler: (err: KoaError, ctx: Koa.Context) => void
  requestHandler: Koa.Middleware
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'koa'): BugsnagPluginKoaResult | undefined
  }
}

// define ctx.bugsnag for koa middleware by declaration merging
declare module 'koa' {
  interface BaseContext {
    bugsnag?: Client
  }
}

interface InternalClient extends Client {
  _clientContext: AsyncLocalStorage<Client>
}

interface KoaError extends Error {
  status?: number
}

const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware',
    attributes: { framework: 'Koa' }
  }
}

const plugin: Plugin = {
  name: 'koa',
  load: (client: Client): BugsnagPluginKoaResult => {
    const internalClient = client as InternalClient

    const requestHandler = async (ctx: Koa.Context, next: Koa.Next) => {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = cloneClient(internalClient)
      if (requestClient._config.autoTrackSessions) {
        requestClient.startSession()
      }

      ctx.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromCtx(ctx)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
        if (event._handledState.severityReason.type === 'unhandledException') {
          event.severity = 'error';
          (event as any)._handledState = handledState
        }
      }, true)

      await internalClient._clientContext.run(requestClient, next)
    }

    requestHandler.v1 = function * (this: Koa.Context, next: Koa.Next) {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = cloneClient(internalClient)
      if (requestClient._config.autoTrackSessions) {
        requestClient.startSession()
      }

      this.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromCtx(this)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
      }, true)

      yield next
    }

    const errorHandler = (err: KoaError, ctx: Koa.Context) => {
      // don't notify if "autoDetectErrors" is disabled OR the error was triggered
      // by ctx.throw with a non 5xx status
      const shouldNotify =
        internalClient._config.autoDetectErrors &&
        (err.status === undefined || err.status >= 500)

      if (shouldNotify) {
        const event = internalClient.Event.create(err, false, handledState, 'koa middleware', 1)

        if (ctx.bugsnag) {
          ctx.bugsnag._notify(event)
        } else {
          internalClient._logger.warn('ctx.bugsnag is not defined. Make sure the @bugsnag/plugin-koa requestHandler middleware is added first.')

          // the request metadata should be added by the requestHandler, but as there's
          // no "ctx.bugsnag" we have to assume the requestHandler has not run
          const { metadata, request } = getRequestAndMetadataFromCtx(ctx)
          event.request = { ...event.request, ...request }
          event.addMetadata('request', metadata)

          internalClient._notify(event)
        }
      }

      const app = ctx.app

      // call Koa's built in onerror if we're the only registered error handler
      // Koa will not add its own error handler if one has already been added,
      // but we want to ensure the default handler still runs after adding Bugsnag
      // unless another handler has also been added
      if (app && typeof app.listenerCount === 'function' && app.listenerCount('error') === 1) {
        app.onerror(err)
      }
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetadataFromCtx = (ctx: Koa.Context) => {
  // Exclude new mappings from metaData but keep existing ones to preserve backwards compatibility
  const { body, ...requestInfo } = extractRequestInfo(ctx)

  return {
    metadata: requestInfo,
    request: {
      body,
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      httpVersion: requestInfo.httpVersion,
      url: requestInfo.url,
      referer: requestInfo.referer // Not part of the notifier spec for request but leaving for backwards compatibility
    }
  }
}

export default plugin
module.exports.default = plugin 
module.exports = plugin
