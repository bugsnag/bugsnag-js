/* eslint node/no-deprecated-api: [error, {ignoreModuleItems: ["domain"]}] */
const domain = require('domain')
const extractRequestInfo = require('./request-info')
const createReportFromErr = require('@bugsnag/core/lib/report-from-error')
const clone = require('@bugsnag/core/lib/clone-client')
const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware',
    attributes: { framework: 'Express/Connect' }
  }
}

module.exports = {
  name: 'express',
  init: client => {
    const requestHandler = (req, res, next) => {
      const dom = domain.create()

      // Get a client to be scoped to this request. If sessions are enabled, use the
      // startSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client.config.autoCaptureSessions ? client.startSession() : clone(client)

      // attach it to the request
      req.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metaData } = getRequestAndMetaDataFromReq(req)
      requestClient.metaData = { ...requestClient.metaData, request: metaData }
      requestClient.request = request

      // unhandled errors caused by this request
      dom.on('error', (err) => {
        req.bugsnag.notify(createReportFromErr(err, handledState), {}, (e, report) => {
          if (e) client._logger.error('Failed to send report to Bugsnag')
          req.bugsnag.config.onUncaughtException(err, report, client._logger)
        })
        if (!res.headersSent) {
          res.statusCode = 500
          res.end('Internal server error')
        }
      })

      return dom.run(next)
    }

    const errorHandler = (err, req, res, next) => {
      if (req.bugsnag) {
        req.bugsnag.notify(createReportFromErr(err, handledState))
      } else {
        client._logger.warn(
          'req.bugsnag is not defined. Make sure the @bugsnag/plugin-express requestHandler middleware is added first.'
        )
        client.notify(createReportFromErr(err, handledState), getRequestAndMetaDataFromReq(req))
      }
      next(err)
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetaDataFromReq = req => {
  const requestInfo = extractRequestInfo(req)
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
