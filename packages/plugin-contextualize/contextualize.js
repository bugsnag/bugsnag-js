/* eslint node/no-deprecated-api: [error, {ignoreModuleItems: ["domain"]}] */
const domain = require('domain')
const ensureError = require('@bugsnag/core/lib/ensure-error')
const Event = require('@bugsnag/core/event')
const { getStack, maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

module.exports = {
  name: 'contextualize',
  init: client => {
    const contextualize = (fn, onError) => {
      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      const handledState = {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }

      const dom = domain.create()
      dom.on('error', maybeError => {
        // check if the stacktrace has no context, if so, if so append the frames we created earlier
        if (maybeError && maybeError.stack) maybeUseFallbackStack(maybeError, fallbackStack)
        const { actualError, metadata } = ensureError(maybeError)
        client._notify(new Event(
          actualError.name,
          actualError.message,
          Event.getStacktrace(actualError, 0, 1),
          maybeError,
          handledState
        ), [
          (event) => {
            if (metadata) event.addMetadata('error', metadata)
            return onError(event)
          }
        ].concat(onError), (e, report) => {
          if (e) client.__logger.error('Failed to send report to Bugsnag')
          client._config.onUncaughtException(maybeError, report, client.__logger)
        })
      })
      process.nextTick(() => dom.run(fn))
    }

    return contextualize
  }
}
