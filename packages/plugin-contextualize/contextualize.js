/* eslint node/no-deprecated-api: [error, {ignoreModuleItems: ["domain"]}] */
const domain = require('domain')
const { getStack, maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

module.exports = {
  name: 'contextualize',
  load: client => {
    const contextualize = (fn, onError) => {
      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      const dom = domain.create()
      dom.on('error', err => {
        // check if the stacktrace has no context, if so, if so append the frames we created earlier
        if (err.stack) maybeUseFallbackStack(err, fallbackStack)
        const event = client.Event.create(err, true, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledException' }
        }, 'contextualize()', 1)
        client._notify(event, onError, (e, event) => {
          if (e) client._logger.error('Failed to send event to Bugsnag')
          client._config.onUncaughtException(err, event, client._logger)
        })
      })
      process.nextTick(() => dom.run(fn))
    }

    return contextualize
  }
}

// add a default export for ESM modules without interop
module.exports.default = module.exports
