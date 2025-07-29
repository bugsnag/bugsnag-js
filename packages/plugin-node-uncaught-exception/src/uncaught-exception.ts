import { Client, Event, Logger, nodeFallbackStack, Plugin } from '@bugsnag/core'
import { AsyncLocalStorage } from 'async_hooks'

interface InternalClient extends Client {
  _clientContext: AsyncLocalStorage<Client>
  fallbackStack?: string
  _config: Client['_config'] & {
    onUncaughtException: (err: Error, event: Event, logger: Logger) => void
  }
}

let _handler: ((err: Error) => Promise<void>) | undefined
const plugin: Plugin = {
  load: (client) => {
    const internalClient = client as InternalClient

    if (!internalClient._config.autoDetectErrors) return
    if (!internalClient._config.enabledErrorTypes.unhandledExceptions) return
    _handler = (err: Error) => {
      // if we are in an async context, use the client from that context
      const ctx = internalClient._clientContext && internalClient._clientContext.getStore()
      const c = (ctx || internalClient) as InternalClient

      // check if the stacktrace has no context, if so append the frames we created earlier
      // see plugin-contextualize for where this is created
      if (err.stack && c.fallbackStack) nodeFallbackStack.maybeUseFallbackStack(err, c.fallbackStack)

      const event = c.Event.create(err, false, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }, 'uncaughtException handler', 1)
      return new Promise<void>(resolve => {
        c._notify(event, () => {}, (e: Error | null | undefined, event: Event) => {
          if (e) c._logger.error('Failed to send event to Bugsnag')
          c._config.onUncaughtException(err, event, c._logger)
          resolve()
        })
      })
    }
    process.prependListener('uncaughtException', _handler)
  },
  destroy: () => {
    if (_handler) {
      process.removeListener('uncaughtException', _handler)
    }
  }
}

export default plugin
