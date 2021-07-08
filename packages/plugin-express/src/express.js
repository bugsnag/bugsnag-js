/* eslint node/no-deprecated-api: [error, {ignoreModuleItems: ["domain"]}] */
const domain = require('domain')
const extractRequestInfo = require('./request-info')
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
  load: client => {
    const requestHandler = (req, res, next) => {
      const dom = domain.create()

      // Get a client to be scoped to this request. If sessions are enabled, use the
      // resumeSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.resumeSession() : clone(client)

      // attach it to the request
      req.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { metadata, request } = getRequestAndMetadataFromReq(req)
        event.request = { ...event.request, ...request }
        requestClient.addMetadata('request', metadata)
      }, true)

      if (!client._config.autoDetectErrors) return next()

      // unhandled errors caused by this request
      dom.on('error', (err) => {
        const event = client.Event.create(err, false, handledState, 'express middleware', 1)
        req.bugsnag._notify(event, () => {}, (e, event) => {
          if (e) client._logger.error('Failed to send event to Bugsnag')
          req.bugsnag._config.onUncaughtException(err, event, client._logger)
        })
        if (!res.headersSent) {
          res.statusCode = 500
          res.end('Internal server error')
        }
      })

      return dom.run(next)
    }

    const errorHandler = (err, req, res, next) => {
      if (!client._config.autoDetectErrors) return next(err)

      const event = client.Event.create(err, false, handledState, 'express middleware', 1)

      const { metadata, request } = getRequestAndMetadataFromReq(req)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)

      if (req.bugsnag) {
        req.bugsnag._notify(event)
      } else {
        client._logger.warn(
          'req.bugsnag is not defined. Make sure the @bugsnag/plugin-express requestHandler middleware is added first.'
        )
        client._notify(event)
      }

      next(err)
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetadataFromReq = req => {
  const requestInfo = extractRequestInfo(req)
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
