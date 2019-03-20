/*
* Automatically notifies Bugsnag when React Native's global error handler is called
*/

const createReportFromErr = require('@bugsnag/core/lib/report-from-error')

module.exports = {
  init: (client, ErrorUtils = global.ErrorUtils) => {
    if (!client.config.autoNotify) return
    if (!ErrorUtils) {
      client._logger.warn('ErrorUtils is not defined. Can’t attach a global error handler.')
      return
    }
    const prev = ErrorUtils.getGlobalHandler()

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      const report = createReportFromErr(error, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      })
      report.attemptImmediateDelivery = false
      client.notify(report, {}, () => {
        if (typeof prev === 'function') prev(error, isFatal)
      })
    })
  }
}
