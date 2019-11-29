/*
* Automatically notifies Bugsnag when React Native's global error handler is called
*/

const createEventFromErr = require('@bugsnag/core/lib/event-from-error')

module.exports = {
  init: (client, ErrorUtils = global.ErrorUtils) => {
    if (!client.config.autoDetectErrors) return
    if (!ErrorUtils) {
      client._logger.warn('ErrorUtils is not defined. Can’t attach a global error handler.')
      return
    }
    const prev = ErrorUtils.getGlobalHandler()

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      const event = createEventFromErr(error, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      })
      event.attemptImmediateDelivery = false
      client.notify(event, () => {}, () => {
        if (typeof prev === 'function') prev(error, isFatal)
      })
    })
  }
}
