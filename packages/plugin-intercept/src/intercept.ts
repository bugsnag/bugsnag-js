import type { Config, Plugin, Stackframe } from '@bugsnag/core'
import { nodeFallbackStack } from '@bugsnag/core'

const plugin: Plugin = {
  name: 'intercept',
  load: client => {
    const intercept = (onError = () => {}, cb: (data: any[]) => void) => {
      if (typeof cb !== 'function') {
        cb = onError
        onError = () => {}
      }

      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = nodeFallbackStack.getStack()

      return (err: Error, ...data: any[]) => {
        if (err) {
          // check if the stacktrace has no context, if so, if so append the frames we created earlier
          if (err.stack) nodeFallbackStack.maybeUseFallbackStack(err, fallbackStack)
          const event = client.Event.create(err, true, {
            severity: 'warning',
            unhandled: false,
            severityReason: { type: 'callbackErrorIntercept' }
          }, 'intercept()', 1)
          client._notify(event, onError)
          return
        }
        cb(...data)  
      }
    }

    return intercept
  }
}


export default plugin

// add a default export for ESM modules without interop
module.exports.default = module.exports
