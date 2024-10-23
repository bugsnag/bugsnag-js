let _handler
module.exports = {
  load: client => {
    if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return
    _handler = err => {
      // if we are in an async context, use the client from that context
      const ctx = client._clientContext && client._clientContext.getStore()
      const c = ctx || client

      // Report unhandled promise rejections as handled if the user has configured it
      const unhandled = !client._config.reportUnhandledPromiseRejectionsAsHandled

      const event = c.Event.create(err, false, {
        severity: 'error',
        unhandled,
        severityReason: { type: 'unhandledPromiseRejection' }
      }, 'unhandledRejection handler', 1)

      return new Promise(resolve => {
        c._notify(event, () => {}, (e, event) => {
          if (e) c._logger.error('Failed to send event to Bugsnag')
          c._config.onUnhandledRejection(err, event, c._logger)
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
