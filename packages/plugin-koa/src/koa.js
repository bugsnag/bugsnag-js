const ensureError = require('@bugsnag/core/lib/ensure-error')
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
  init: client => {
    const requestHandler = async (ctx, next) => {
      // Get a client to be scoped to this request. If sessions are enabled, use the
      // startSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.startSession() : clone(client)

      ctx.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metadata } = getRequestAndMetaDataFromCtx(ctx)
      requestClient.addMetadata('request', metadata)

      try {
        await next()
      } catch (maybeError) {
        if (maybeError.status === undefined || maybeError.status >= 500) {
          const { actualError, metadata } = ensureError(maybeError)
          ctx.bugsnag._notify(new client.Event(
            actualError.name,
            actualError.message,
            client.Event.getStacktrace(actualError, 0, 1),
            maybeError,
            handledState
          ), (event) => {
            event.request = { ...event.request, ...request }
            if (metadata) event.addMetadata('error', metadata)
          })
        }
        if (!ctx.response.headerSent) ctx.response.status = maybeError.status || 500
        try {
          // this function will throw if you give it a non-error, but we still want
          // to output that, so if it throws, pass it back what it threw (a TypeError)
          ctx.app.onerror(maybeError)
        } catch (e) {
          ctx.app.onerror(e)
        }
      }
    }

    requestHandler.v1 = function * (next) {
      // Get a client to be scoped to this request. If sessions are enabled, use the
      // startSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.startSession() : clone(client)

      this.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metadata } = getRequestAndMetaDataFromCtx(this)
      requestClient.addMetadata('request', metadata)
      this.bugsnag.__request = request

      try {
        yield next
      } catch (maybeError) {
        if (maybeError.status === undefined || maybeError.status >= 500) {
          const { actualError, metadata } = ensureError(maybeError)
          this.bugsnag._notify(new client.Event(
            actualError.name,
            actualError.message,
            client.Event.getStacktrace(actualError, 0, 1),
            maybeError,
            handledState
          ), (event) => {
            event.request = { ...event.request, ...this.bugsnag.__request }
            if (metadata) event.addMetadata('error', metadata)
          })
        }
        if (!this.headerSent) this.status = maybeError.status || 500
      }
    }

    const errorHandler = (maybeError, ctx) => {
      const { actualError, metadata } = ensureError(maybeError)
      const errMetadata = metadata
      if (ctx.bugsnag) {
        ctx.bugsnag._notify(new client.Event(
          actualError.name,
          actualError.message,
          client.Event.getStacktrace(actualError, 0, 1),
          maybeError,
          handledState
        ), (event) => {
          if (metadata) event.addMetadata('error', metadata)
          event.request = { ...event.request, ...ctx.bugsnag.__request }
        })
      } else {
        client.__logger.warn('ctx.bugsnag is not defined. Make sure the @bugsnag/plugin-koa requestHandler middleware is added first.')
        client._notify(new client.Event(
          actualError.name,
          actualError.message,
          client.Event.getStacktrace(actualError, 0, 1),
          maybeError,
          handledState
        ), event => {
          if (errMetadata) event.addMetadata('error', errMetadata)
          const { request, metadata } = getRequestAndMetaDataFromCtx(ctx)
          event.addMetadata('request', metadata)
          event.request = { ...event.request, ...request }
        })
      }
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetaDataFromCtx = ctx => {
  const requestInfo = extractRequestInfo(ctx)
  return {
    metadata: requestInfo,
    request: {
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      url: requestInfo.url,
      referer: requestInfo.referer
    }
  }
}

module.exports.default = module.exports
