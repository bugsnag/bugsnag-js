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
      // Get a client to be scoped to this request. If sessions are enabled, use the
      // startSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.startSession() : clone(client)

      ctx.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromCtx(ctx)
        event.request = { ...event.request, ...request }
        requestClient.addMetadata('request', metadata)
      }, true)

      try {
        await next()
      } catch (err) {
        if (err.status === undefined || err.status >= 500) {
          const event = client.Event.create(err, false, handledState, 'koa middleware', 1)
          ctx.bugsnag._notify(event)
        }
        if (!ctx.response.headerSent) ctx.response.status = err.status || 500
        try {
          // this function will throw if you give it a non-error, but we still want
          // to output that, so if it throws, pass it back what it threw (a TypeError)
          ctx.app.onerror(err)
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
      const { request, metadata } = getRequestAndMetadataFromCtx(this)
      requestClient.addMetadata('request', metadata)
      requestClient.addOnError((event) => {
        event.request = { ...event.request, ...request }
      }, true)

      try {
        yield next
      } catch (err) {
        if (err.status === undefined || err.status >= 500) {
          const event = client.Event.create(err, false, handledState, 'koa middleware', 1)
          this.bugsnag._notify(event)
        }
        if (!this.headerSent) this.status = err.status || 500
      }
    }

    const errorHandler = (err, ctx) => {
      const event = client.Event.create(err, false, handledState, 'koa middleware', 1)

      const { metadata, request } = getRequestAndMetadataFromCtx(ctx)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)

      if (ctx.bugsnag) {
        ctx.bugsnag._notify(event)
      } else {
        client._logger.warn('ctx.bugsnag is not defined. Make sure the @bugsnag/plugin-koa requestHandler middleware is added first.')
        client._notify(event)
      }
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetadataFromCtx = ctx => {
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
