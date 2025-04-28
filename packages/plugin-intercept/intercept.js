const { getStack, maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

module.exports = {
  name: 'intercept',
  load: client => {
    const intercept = (onError = () => {}, cb) => {
      if (typeof cb !== 'function') {
        cb = onError
        onError = () => {}
      }

      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      return (err, ...data) => {
        if (err) {
          // check if the stacktrace has no context, if so, if so append the frames we created earlier
          if (err.stack) maybeUseFallbackStack(err, fallbackStack)
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

// add a default export for ESM modules without interop
module.exports.default = module.exports
