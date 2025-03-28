const { getStack } = require('@bugsnag/core/lib/node-fallback-stack')
import { cloneClient } from '@bugsnag/core'

module.exports = {
  name: 'contextualize',
  load: client => {
    const contextualize = (fn, onError) => {
      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      const clonedClient = cloneClient(client)

      // add the stacktrace to the cloned client so it can be used later
      // by the uncaught exception handler. Note the unhandled rejection
      // handler does not need this because it gets a stacktrace
      clonedClient.fallbackStack = fallbackStack

      clonedClient.addOnError(onError)

      client._clientContext.run(clonedClient, fn)
    }

    return contextualize
  }
}

// add a default export for ESM modules without interop
module.exports.default = module.exports
