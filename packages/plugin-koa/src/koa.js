const createReportFromErr = require('@bugsnag/core/lib/report-from-error')
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
      const requestClient = client.config.autoCaptureSessions ? client.startSession() : clone(client)

      ctx.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metaData } = getRequestAndMetaDataFromCtx(ctx)
      requestClient.metaData = { ...requestClient.metaData, request: metaData }
      requestClient.request = request

      try {
        await next()
      } catch (err) {
        ctx.bugsnag.notify(createReportFromErr(err, handledState))
        if (!ctx.response.headerSent) ctx.response.status = 500
      }
    }

    requestHandler.v1 = function * (next) {
      // Get a client to be scoped to this request. If sessions are enabled, use the
      // startSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client.config.autoCaptureSessions ? client.startSession() : clone(client)

      this.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metaData } = getRequestAndMetaDataFromCtx(this)
      requestClient.metaData = { ...requestClient.metaData, request: metaData }
      requestClient.request = request

      try {
        yield next
      } catch (err) {
        this.bugsnag.notify(createReportFromErr(err, handledState))
        if (!this.headerSent) this.status = 500
      }
    }

    const errorHandler = (err, ctx) => {
      if (ctx.bugsnag) {
        ctx.bugsnag.notify(createReportFromErr(err, handledState))
      } else {
        client._logger.warn('ctx.bugsnag is not defined. Make sure the @bugsnag/plugin-koa requestHandler middleware is added first.')
        client.notify(createReportFromErr(err, handledState), getRequestAndMetaDataFromCtx(ctx))
      }
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetaDataFromCtx = ctx => {
  const requestInfo = extractRequestInfo(ctx)
  return {
    metaData: requestInfo,
    request: {
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      url: requestInfo.url,
      referer: requestInfo.referer
    }
  }
}

module.exports['default'] = module.exports
