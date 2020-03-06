let _handler
module.exports = {
  load: client => {
    if (!client._config.autoDetectErrors) return
    if (!client._config.enabledErrorTypes.unhandledExceptions) return
    _handler = err => {
      const event = client.Event.create(err, false, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }, 'uncaughtException handler', 1)
      client._notify(event, () => {}, (e, event) => {
        if (e) client._logger.error('Failed to send event to Bugsnag')
        client._config.onUncaughtException(err, event, client._logger)
      })
    }
    process.on('uncaughtException', _handler)
  },
  destroy: () => {
    process.removeListener('uncaughtException', _handler)
  }
}
