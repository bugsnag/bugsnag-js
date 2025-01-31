const extractRequestInfo = require('./request-info')
const clone = require('@bugsnag/core/lib/clone-client')
const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware',
    attributes: { framework: 'Hono' }
  }
}

module.exports = {
  name: 'hono',
  load: client => {
    const requestHandler = async (c, next) => {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = clone(client)
      if (requestClient._config.autoTrackSessions) {
        requestClient.startSession()
      }

      // attach it to the request
      c.req.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError((event) => {
        const { metadata, request } = getRequestAndMetadataFromReq(c)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
        if (event._handledState.severityReason.type === 'unhandledException') {
          event.severity = 'error'
          event._handledState = handledState
        }
      }, true)

      await client._clientContext.run(requestClient, next)
    }

    const errorHandler = (c, next) => {
      // if (!client._config.autoDetectErrors) return next(c.error)

      const event = client.Event.create(c.error, false, handledState, 'hono middleware', 1)

      const { metadata, request } = getRequestAndMetadataFromReq(c.req)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)

      if (c.bugsnag) {
        c.bugsnag._notify(event)
      } else {
        client._logger.warn(
          ''
        )
        client._notify(event)
      }

      // next(c.error)
    }

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetadataFromReq = c => {
  const { body, ...requestInfo } = extractRequestInfo(c)
  return {
    metadata: requestInfo,
    request: {
      body,
      url: requestInfo.url
    }
  }
}

module.exports.default = module.exports
