const createEventFromErr = require('@bugsnag/core/lib/event-from-error')

let _handler
module.exports = {
  init: client => {
    if (!client.config.autoNotify) return
    _handler = err => {
      client.notify(createEventFromErr(err, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }), {}, (e, event) => {
        if (e) client._logger.error('Failed to send event to Bugsnag')
        client.config.onUncaughtException(err, event, client._logger)
      })
    }
    process.on('uncaughtException', _handler)
  },
  destroy: () => {
    process.removeListener('uncaughtException', _handler)
  }
}
