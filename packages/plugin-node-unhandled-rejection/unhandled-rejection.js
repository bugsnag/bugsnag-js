let _handler
module.exports = {
  load: client => {
    if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return
    _handler = err => {
      // if we are in an async context, use the client from that context
      const c = (client._clientContext && typeof client._clientContext.getStore === 'function') ? client._clientContext.getStore() : client

      const event = c.Event.create(err, false, {
        severity: 'error',
        unhandled: true,
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
