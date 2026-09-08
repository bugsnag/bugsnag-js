import type { Client, OnErrorCallback, Plugin } from '@bugsnag/core'
import { cloneClient, nodeFallbackStack } from '@bugsnag/core'
import type { AsyncLocalStorage } from 'async_hooks'

interface InternalClient extends Client {
  _clientContext: AsyncLocalStorage<Client>
  fallbackStack?: string
}

const plugin: Plugin = {
  name: 'contextualize',
  load: client => {
    const internalClient = client as InternalClient

    const contextualize = <T>(fn: () => T | Promise<T>, onError?: OnErrorCallback): T | Promise<T> => {
      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = nodeFallbackStack.getStack()

      const clonedClient = cloneClient(internalClient) as InternalClient

      // add the stacktrace to the cloned client so it can be used later
      // by the uncaught exception handler. Note the unhandled rejection
      // handler does not need this because it gets a stacktrace
      clonedClient.fallbackStack = fallbackStack

      if(onError) {
          clonedClient.addOnError(onError)
      }

      return internalClient._clientContext.run(clonedClient, fn)
    }

    return contextualize
  }
}

export default plugin