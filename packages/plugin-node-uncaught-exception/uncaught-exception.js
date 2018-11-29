const createReportFromErr = require('@bugsnag/core/lib/report-from-error')

let _handler
module.exports = {
  init: client => {
    if (!client.config.autoNotify) return
    _handler = err => {
      client.notify(createReportFromErr(err, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }), {}, (e, report) => {
        if (e) client._logger.error('Failed to send report to Bugsnag')
        client.config.onUncaughtException(err, report, client._logger)
      })
    }
    process.on('uncaughtException', _handler)
  },
  destroy: () => {
    process.removeListener('uncaughtException', _handler)
  }
}
