const createEventFromErr = require('@bugsnag/core/lib/event-from-error')

let _handler
module.exports = {
  init: client => {
    if (!client._config.autoDetectErrors || !client._config.autoDetectUnhandledRejections) return
    _handler = err => {
      client.notify(createEventFromErr(err, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledPromiseRejection' }
      }), () => {}, (e, event) => {
        if (e) client._logger.error('Failed to send event to Bugsnag')
        client._config.onUnhandledRejection(err, event, client._logger)
      })
    }
    process.on('unhandledRejection', _handler)
  },
  destroy: () => {
    process.removeListener('unhandledRejection', _handler)
  }
}
