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
      const requestInfo = extractRequestInfo(ctx)
      sessionClient.metaData = { ...sessionClient.metaData, request: requestInfo }
      sessionClient.request = {
        clientIp: requestInfo.clientIp,
        headers: requestInfo.headers,
        httpMethod: requestInfo.httpMethod,
        url: requestInfo.url,
        referer: requestInfo.referer
      }

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
        const requestInfo = extractRequestInfo(ctx)
        const metaData = { request: requestInfo }
        const request = {
          clientIp: requestInfo.clientIp,
          headers: requestInfo.headers,
          httpMethod: requestInfo.httpMethod,
          url: requestInfo.url,
          referer: requestInfo.referer
        }
        client.notify(createReportFromErr(err, handledState), { metaData, request })
      }
    }

    return { requestHandler, errorHandler }
  }
}
