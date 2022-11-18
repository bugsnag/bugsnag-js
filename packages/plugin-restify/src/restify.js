const extractRequestInfo = require('./request-info')
const clone = require('@bugsnag/core/lib/clone-client')
const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware',
    attributes: { framework: 'Restify' }
  }
}

module.exports = {
  name: 'restify',
  load: client => {
    const requestHandler = (req, res, next) => {
      // Get a client to be scoped to this request. If sessions are enabled, use the
      // resumeSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.resumeSession() : clone(client)

      // attach it to the request
      req.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { request, metadata } = getRequestAndMetadataFromReq(req)
        event.request = { ...event.request, ...request }
        requestClient.addMetadata('request', metadata)
      }, true)

      if (!client._config.autoDetectErrors) return next()

      if (client._clientContext) {
        client._clientContext.run(requestClient, () => next())
      } else {
        next()
      }
    }

    const errorHandler = (req, res, err, cb) => {
      if (!client._config.autoDetectErrors) return cb()
      if (err.statusCode && err.statusCode < 500) return cb()

      const event = client.Event.create(err, false, handledState, 'restify middleware', 1)
      const { metadata, request } = getRequestAndMetadataFromReq(req)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)

      if (req.bugsnag) {
        req.bugsnag._notify(event)
      } else {
        client._logger.warn(
          'req.bugsnag is not defined. Make sure the @bugsnag/plugin-restify requestHandler middleware is added first.'
        )
        client._notify(event)
      }
      cb()
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetadataFromReq = req => {
  const { body, ...requestInfo } = extractRequestInfo(req)
  return {
    metadata: requestInfo,
    request: {
      body,
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      url: requestInfo.url,
      referer: requestInfo.referer // Not part of the notifier spec for request but leaving for backwards compatibility
    }
  }
}

module.exports.default = module.exports
