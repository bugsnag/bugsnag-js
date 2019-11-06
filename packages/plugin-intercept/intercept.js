const ensureError = require('@bugsnag/core/lib/ensure-error')
const Event = require('@bugsnag/core/event')

const { getStack, maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

module.exports = {
  name: 'intercept',
  init: client => {
    const intercept = (cb = () => {}) => {
      const handledState = {
        severity: 'warning',
        unhandled: false,
        severityReason: { type: 'callbackErrorIntercept' }
      }

      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      return (maybeError, ...data) => {
        if (maybeError) {
          // check if the stacktrace has no context, if so, if so append the frames we created earlier
          if (maybeError && maybeError.stack) maybeUseFallbackStack(maybeError, fallbackStack)
          const { actualError, metadata } = ensureError(maybeError)
          client._notify(new Event(
            actualError.name,
            actualError.message,
            Event.getStacktrace(actualError, 0, 1),
            maybeError,
            handledState
          ), (event) => {
            if (metadata) event.addMetadata('error', metadata)
          })
          return
        }
        cb(...data) // eslint-disable-line
      }
    }

    return intercept
  }
}
