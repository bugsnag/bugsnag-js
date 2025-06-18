const { createMiddleware } = require('hono/factory')
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
    const requestHandler = createMiddleware(async (c, next) => {
      // clone the client to be scoped to this request. If sessions are enabled, start one
      const requestClient = clone(client)
      if (requestClient._config.autoTrackSessions) {
        requestClient.startSession()
      }

      c.bugsnag = requestClient

      // extract request info and pass it to the relevant bugsnag properties
      requestClient.addOnError(async (event) => {
        const { metadata, request } = await getRequestAndMetadataFromReq(c)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
        if (event._handledState.severityReason.type === 'unhandledException') {
          event.severity = 'error'
          event._handledState = handledState
        }
      }, true)

      await client._clientContext.run(requestClient, next)
    })

    const errorHandler = createMiddleware(async (c, next) => {
      next()

      if (!c.error || !client._config.autoDetectErrors) return

      const event = client.Event.create(c.error, false, handledState, 'hono middleware', 1)

      if (c.bugsnag) {
        c.bugsnag._notify(event)
      } else {
        client._logger.warn(
          'c.bugsnag is not defined. Make sure the @bugsnag/plugin-hono requestHandler middleware is added first.'
        )
        const { metadata, request } = await getRequestAndMetadataFromReq(c)
        event.request = { ...event.request, ...request }
        event.addMetadata('request', metadata)
        client._notify(event)
      }
    })

    return { requestHandler, errorHandler }
  }
}

const getRequestAndMetadataFromReq = async c => {
  const { body, ...requestInfo } = await extractRequestInfo(c)
  return {
    metadata: requestInfo,
    request: {
      body,
      url: requestInfo.url,
      httpMethod: requestInfo.httpMethod,
      httpVersion: requestInfo.httpVersion,
      headers: requestInfo.headers
    }
  }
}

module.exports.default = module.exports
