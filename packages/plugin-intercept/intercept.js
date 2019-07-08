const createReportFromErr = require('@bugsnag/core/lib/report-from-error')
const { getStack, maybeUseFallbackStack } = require('@bugsnag/core/lib/node-fallback-stack')

module.exports = {
  name: 'intercept',
  init: client => {
    const intercept = (beforeSend, cb) => {
      if (typeof cb !== 'function') {
        cb = beforeSend
        beforeSend = () => {}
      }

      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = getStack()

      return (err, ...data) => {
        if (err) {
          // check if the stacktrace has no context, if so, if so append the frames we created earlier
          if (err.stack) maybeUseFallbackStack(err, fallbackStack)
          const report = createReportFromErr(err, {
            severity: 'warning',
            unhandled: false,
            severityReason: { type: 'callbackErrorIntercept' }
          })
          client.notify(report, beforeSend)
          return
        }
        cb(...data) // eslint-disable-line
      }
    }

    return intercept
  }
}
