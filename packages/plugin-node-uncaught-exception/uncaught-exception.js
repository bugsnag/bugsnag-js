let _handler
module.exports = {
  init: client => {
    if (!client._config.autoDetectErrors) return
    _handler = err => {
      const event = client.BugsnagEvent.create(err, true, {
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
