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
      // resumeSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.resumeSession() : clone(client)

      ctx.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromCtx(ctx)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
      }, true)

      if (!client._config.autoDetectErrors) return next()

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
      // resumeSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.resumeSession() : clone(client)

      this.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metadata } = getRequestAndMetadataFromCtx(this)
      requestClient.addMetadata('request', metadata)
      requestClient.addOnError((event) => {
        event.request = { ...event.request, ...request }
      }, true)

      if (!client._config.autoDetectErrors) return next()

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
      if (!client._config.autoDetectErrors) return

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
