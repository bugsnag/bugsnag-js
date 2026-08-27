import { Client, Event, Logger, Plugin } from '@bugsnag/core'
import { AsyncLocalStorage } from 'async_hooks'

interface NodeConfig {
  onUnhandledRejection: (err: Error, event: Event, logger: Logger) => void
  reportUnhandledPromiseRejectionsAsHandled: boolean
}

interface InternalClient extends Client {
  _clientContext: AsyncLocalStorage<Client>
  _config: Client['_config'] & NodeConfig
}

// Type for the process with unhandledRejection event support
type ProcessWithUnhandledRejection = NodeJS.Process & {
  prependListener(event: 'unhandledRejection', listener: (reason: any) => void): NodeJS.Process
  on(event: 'unhandledRejection', listener: (reason: any) => void): NodeJS.Process
  removeListener(event: 'unhandledRejection', listener: (reason: any) => void): NodeJS.Process
}

let _handler: ((err: Error) => Promise<void>) | undefined

const plugin: Plugin = {
  load: client => {
    const internalClient = client as InternalClient
    if (!internalClient._config.autoDetectErrors || !internalClient._config.enabledErrorTypes.unhandledRejections) return
    _handler = err => {
      // if we are in an async context, use the client from that context
      const ctx = internalClient._clientContext && internalClient._clientContext.getStore()
      const c = ctx || internalClient

      // Report unhandled promise rejections as handled if the user has configured it
      const unhandled = !internalClient._config.reportUnhandledPromiseRejectionsAsHandled

      const event = c.Event.create(err, false, {
        severity: 'error',
        unhandled,
        severityReason: { type: 'unhandledPromiseRejection' }
      }, 'unhandledRejection handler', 1)

      return new Promise<void>(resolve => {
        c._notify(event, () => {}, (e, event) => {
          if (e) c._logger.error('Failed to send event to Bugsnag')
          const clientConfig = c._config as Client['_config'] & NodeConfig
          clientConfig.onUnhandledRejection(err, event, c._logger)
          resolve()
        })
      })
    }

    // Prepend the listener if we can (Node 6+)
    const nodeProcess = process as ProcessWithUnhandledRejection
    if (nodeProcess.prependListener) {
      nodeProcess.prependListener('unhandledRejection', _handler)
    } else {
      nodeProcess.on('unhandledRejection', _handler)
    }
  },
  destroy: () => {
    if (_handler) {
      const nodeProcess = process as ProcessWithUnhandledRejection
      nodeProcess.removeListener('unhandledRejection', _handler)
    }
  }
}

export default plugin