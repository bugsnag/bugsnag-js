const { cloneClient } = require('@bugsnag/core')
const extractRequestInfo = require('./request-info')

const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware',
    attributes: { framework: 'Koa' }
  }
}

module.exports = {
  name: 'koa',
  load: client => {
    const requestHandler = async (ctx, next) => {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = cloneClient(client)
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
          event.severity = 'error'
          event._handledState = handledState
        }
      }, true)

      await client._clientContext.run(requestClient, next)
    }

    requestHandler.v1 = function * (next) {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = cloneClient(client)
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

    const errorHandler = (err, ctx) => {
      // don't notify if "autoDetectErrors" is disabled OR the error was triggered
      // by ctx.throw with a non 5xx status
      const shouldNotify =
        client._config.autoDetectErrors &&
        (err.status === undefined || err.status >= 500)

      if (shouldNotify) {
        const event = client.Event.create(err, false, handledState, 'koa middleware', 1)

        if (ctx.bugsnag) {
          ctx.bugsnag._notify(event)
        } else {
          client._logger.warn('ctx.bugsnag is not defined. Make sure the @bugsnag/plugin-koa requestHandler middleware is added first.')

          // the request metadata should be added by the requestHandler, but as there's
          // no "ctx.bugsnag" we have to assume the requestHandler has not run
          const { metadata, request } = getRequestAndMetadataFromCtx(ctx)
          event.request = { ...event.request, ...request }
          event.addMetadata('request', metadata)

          client._notify(event)
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

const getRequestAndMetadataFromCtx = ctx => {
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

module.exports.default = module.exports
