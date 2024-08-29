const { maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

let _handler
module.exports = {
  load: client => {
    if (!client._config.autoDetectErrors) return
    if (!client._config.enabledErrorTypes.unhandledExceptions) return
    _handler = err => {
      // if we are in an async context, use the client from that context
      const c = (client._clientContext && client._clientContext.getStore()) ? client._clientContext.getStore() : client

      // check if the stacktrace has no context, if so append the frames we created earlier
      // see plugin-contextualize for where this is created
      if (err.stack && c.fallbackStack) maybeUseFallbackStack(err, c.fallbackStack)

      const event = c.Event.create(err, false, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }, 'uncaughtException handler', 1)
      return new Promise(resolve => {
        c._notify(event, () => {}, (e, event) => {
          if (e) c._logger.error('Failed to send event to Bugsnag')
          c._config.onUncaughtException(err, event, c._logger)
          resolve()
        })
      })
    }
    process.prependListener('uncaughtException', _handler)
  },
  destroy: () => {
    process.removeListener('uncaughtException', _handler)
  }
}
