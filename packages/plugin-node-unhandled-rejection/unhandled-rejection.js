let _handler
module.exports = {
  load: client => {
    if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return
    _handler = err => {
      const event = client.Event.create(err, false, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledPromiseRejection' }
      }, 'unhandledRejection handler', 1)

      return new Promise(resolve => {
        client._notify(event, () => {}, (e, event) => {
          if (e) client._logger.error('Failed to send event to Bugsnag')
          client._config.onUnhandledRejection(err, event, client._logger)
          resolve()
        })
      })
    }

    // Prepend the listener if we can (Node 6+)
    if (process.prependListener) {
      process.prependListener('unhandledRejection', _handler)
    } else {
      process.on('unhandledRejection', _handler)
    }
  },
  destroy: () => {
    process.removeListener('unhandledRejection', _handler)
  }
}
