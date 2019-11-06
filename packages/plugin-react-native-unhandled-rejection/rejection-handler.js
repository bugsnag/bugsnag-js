/*
* Automatically notifies Bugsnag when an unhandled promise rejection happens in React Native
*/

const rnPromise = require('promise/setimmediate/rejection-tracking')
const ensureError = require('@bugsnag/core/lib/ensure-error')

module.exports = {
  init: (client) => {
    if (client._config.autoDetectErrors === false || client._config.autoDetectUnhandledRejections === false) return () => {}
    const handledState = {
      severity: 'error',
      unhandled: true,
      severityReason: { type: 'unhandledPromiseRejection' }
    }
    rnPromise.enable({
      allRejections: true,
      onUnhandled: (id, maybeError) => {
        const { actualError, metadata } = ensureError(maybeError)
        client._notify(new client.Event(
          actualError.name,
          actualError.message,
          client.Event.getStacktrace(actualError, 0, 1),
          maybeError,
          handledState
        ), event => {
          if (metadata) event.addMetadata('error', metadata)
        })
      }
    })
    return () => rnPromise.disable()
  }
}
