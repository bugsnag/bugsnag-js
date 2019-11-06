const ensureError = require('@bugsnag/core/lib/ensure-error')
const Event = require('@bugsnag/core/event')

let _handler
module.exports = {
  init: client => {
    if (client._config.autoDetectErrors === false && client._config.autoDetectUnhandledRejections !== true) return
    _handler = maybeError => {
      const { actualError, metadata } = ensureError(maybeError)
      const handledState = {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledPromiseRejection' }
      }
      client._notify(new Event(
        actualError.name,
        actualError.message,
        Event.getStacktrace(actualError, 0, 1),
        maybeError,
        handledState
      ), (event) => {
        event.addMetadata('error', metadata)
      }, (e, report) => {
        if (e) client.__logger.error('Failed to send report to Bugsnag')
        client._config.onUnhandledRejection(maybeError, report, client.__logger)
      })
    }
    process.on('unhandledRejection', _handler)
  },
  destroy: () => {
    process.removeListener('unhandledRejection', _handler)
  }
}
