/*
* Automatically notifies Bugsnag when React Native's global error handler is called
*/

const createReportFromErr = require('@bugsnag/core/lib/report-from-error')

module.exports = {
  init: (client, ErrorUtils = global.ErrorUtils) => {
    if (!client.config.autoNotify) return
    const prev = ErrorUtils.getGlobalHandler()

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      client.notify(createReportFromErr(error, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }), {}, () => {
        if (typeof prev === 'function') prev(error, isFatal)
      })
    })
  }
}
