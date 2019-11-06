const domain = require('domain') // eslint-disable-line
const extractRequestInfo = require('./request-info')
const ensureError = require('@bugsnag/core/lib/ensure-error')
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
  init: client => {
    const requestHandler = (req, res, next) => {
      const dom = domain.create()

      // Get a client to be scoped to this request. If sessions are enabled, use the
      // startSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client._config.autoTrackSessions ? client.startSession() : clone(client)

      // attach it to the request
      req.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metadata } = getRequestAndMetaDataFromReq(req)
      requestClient.addMetadata('request', metadata)
      req.bugsnag.__request = request

      // unhandled errors caused by this request
      dom.on('error', (maybeError) => {
        const { actualError, metadata } = ensureError(maybeError)
        req.bugsnag._notify(new client.Event(
          actualError.name,
          actualError.message,
          client.Event.getStacktrace(actualError, 0, 1),
          maybeError,
          handledState
        ), event => {
          if (metadata) event.addMetadata('error', metadata)
          event.request = { ...event.request, ...req.bugsnag.__request }
        }, (e, event) => {
          if (e) client.__logger.error('Failed to send event to Bugsnag')
          req.bugsnag._config.onUncaughtException(maybeError, event, client.__logger)
        })
        if (!res.headersSent) {
          const body = 'Internal server error'
          res.writeHead(500, {
            'Content-Length': Buffer.byteLength(body),
            'Content-Type': 'text/plain'
          })
          res.end(body)
        }
      })

      return dom.run(next)
    }

    const errorHandler = (req, res, maybeError, cb) => {
      const { actualError, metadata } = ensureError(maybeError)
      const errMetadata = metadata
      if (maybeError.statusCode && maybeError.statusCode < 500) return cb()
      if (req.bugsnag) {
        req.bugsnag._notify(new client.Event(
          actualError.name,
          actualError.message,
          client.Event.getStacktrace(actualError, 0, 1),
          maybeError,
          handledState
        ), event => {
          if (metadata) event.addMetadata('error', metadata)
          event.request = { ...event.request, ...req.bugsnag.__request }
        })
      } else {
        client.__logger.warn(
          'req.bugsnag is not defined. Make sure the @bugsnag/plugin-restify requestHandler middleware is added first.'
        )
        client._notify(new client.Event(
          actualError.name,
          actualError.message,
          client.Event.getStacktrace(actualError, 0, 1),
          maybeError,
          handledState
        ), event => {
          if (errMetadata) event.addMetadata('error', errMetadata)
          const { request, metadata } = getRequestAndMetaDataFromReq(req)
          event.addMetadata('request', metadata)
          event.request = { ...event.request, ...request }
        })
      }
      cb()
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetaDataFromReq = req => {
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
