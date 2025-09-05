import type { Client, OnErrorCallback, Plugin } from '@bugsnag/core'
import { cloneClient, nodeFallbackStack } from '@bugsnag/core'
import { AsyncLocalStorage } from 'async_hooks'

interface InternalClient extends Client {
  _clientContext: AsyncLocalStorage<Client>
  fallbackStack?: string | undefined
}

const plugin: Plugin = {
  name: 'contextualize',
  load: client => {
    const internalClient = client as InternalClient

    const contextualize = (fn: () => void, onError: OnErrorCallback) => {
      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = nodeFallbackStack.getStack()

      const clonedClient = cloneClient(internalClient) as InternalClient

      // add the stacktrace to the cloned client so it can be used later
      // by the uncaught exception handler. Note the unhandled rejection
      // handler does not need this because it gets a stacktrace
      clonedClient.fallbackStack = fallbackStack

      clonedClient.addOnError(onError)

      internalClient._clientContext.run(clonedClient, fn)
    }

    return contextualize
  }
}

export default plugin
