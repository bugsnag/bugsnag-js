const createEventFromErr = require('@bugsnag/core/lib/event-from-error')
const { getStack, maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

module.exports = {
  name: 'intercept',
  init: client => {
    const intercept = (opts, cb = () => {}) => {
      if (typeof opts === 'function') {
        cb = opts
        opts = {}
      }

      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      return (err, ...data) => {
        if (err) {
          // check if the stacktrace has no context, if so, if so append the frames we created earlier
          if (err.stack) maybeUseFallbackStack(err, fallbackStack)
          const event = createEventFromErr(err, {
            severity: 'warning',
            unhandled: false,
            severityReason: { type: 'callbackErrorIntercept' }
          })
          client.notify(event, opts)
          return
        }
        cb(...data) // eslint-disable-line
      }
    }

    return intercept
  }
}
