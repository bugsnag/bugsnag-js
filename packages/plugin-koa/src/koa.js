const createReportFromErr = require('@bugsnag/core/lib/report-from-error')
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
      // Start a session whether sessions are used or not. We use this
      // to store request-specific info, in case of any errors.
      const sessionClient = client.startSession()

      ctx.bugsnag = sessionClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metaData } = getRequestAndMetaDataFromCtx(ctx)
      sessionClient.metaData = { ...sessionClient.metaData, request: metaData }
      sessionClient.request = request

      try {
        await next()
      } catch (err) {
        ctx.bugsnag.notify(createReportFromErr(err, handledState))
        if (!ctx.response.headerSent) ctx.response.status = 500
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
