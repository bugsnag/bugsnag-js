/*
* Automatically notifies Bugsnag when React Native's global error handler is called
*/

const ensureError = require('@bugsnag/core/lib/ensure-error')

module.exports = {
  init: (client, ErrorUtils = global.ErrorUtils) => {
    if (client._config.autoDetectErrors === false) return
    if (!ErrorUtils) {
      client.__logger.warn('ErrorUtils is not defined. Can’t attach a global error handler.')
      return
    }
    const prev = ErrorUtils.getGlobalHandler()

    ErrorUtils.setGlobalHandler((maybeError, isFatal) => {
      const handledState = {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }
      const { actualError, metadata } = ensureError(maybeError)
      const event = new client.Event(
        actualError.name,
        actualError.message,
        client.Event.getStacktrace(actualError, 0, 1),
        maybeError,
        handledState
      )
      event.attemptImmediateDelivery = false
      client._notify(event, event => {
        if (metadata) event.addMetadata('error', metadata)
      }, () => {
        if (typeof prev === 'function') prev(maybeError, isFatal)
      })
    })
  }
}
