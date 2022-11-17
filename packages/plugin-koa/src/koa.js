/* eslint node/no-deprecated-api: [error, {ignoreModuleItems: ["domain"]}] */
const domain = require('domain')
const clone = require('@bugsnag/core/lib/clone-client')
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
      const dom = domain.create()

      // Get a client to be scoped to this request. If sessions are enabled, use the
      // resumeSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.resumeSession() : clone(client)

      ctx.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromCtx(ctx)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
      }, true)

      // unhandled errors caused by this request
      dom.on('error', (err) => {
        const event = client.Event.create(err, false, handledState, 'koa middleware', 1)
        ctx.bugsnag._notify(event, () => {}, (e, event) => {
          if (e) client._logger.error('Failed to send event to Bugsnag')
          ctx.bugsnag._config.onUncaughtException(err, event, client._logger)
        })
        if (!ctx.response.headersSent) {
          ctx.response.status = 500
        }
      })

      dom.enter()
      await next()
      dom.exit()
    }

    requestHandler.v1 = function * (next) {
      // Get a client to be scoped to this request. If sessions are enabled, use the
      // resumeSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.resumeSession() : clone(client)

      this.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromCtx(this)
        event.request = { ...event.request, ...request }
        requestClient.addMetadata('request', metadata)
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
