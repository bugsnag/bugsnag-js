/* eslint node/no-deprecated-api: [error, {ignoreModuleItems: ["domain"]}] */
const domain = require('domain')
const createReportFromErr = require('@bugsnag/core/lib/report-from-error')
const { getStack, maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

module.exports = {
  name: 'contextualize',
  init: client => {
    const contextualize = (fn, opts) => {
      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      const dom = domain.create()
      dom.on('error', err => {
        // check if the stacktrace has no context, if so, if so append the frames we created earlier
        if (err.stack) maybeUseFallbackStack(err, fallbackStack)
        const report = createReportFromErr(err, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledException' }
        })
        client.notify(report, opts, (e, report) => {
          if (e) client._logger.error('Failed to send report to Bugsnag')
          client.config.onUncaughtException(err, report, client._logger)
        })
      })
      process.nextTick(() => dom.run(fn))
    }

    return contextualize
  }
}
