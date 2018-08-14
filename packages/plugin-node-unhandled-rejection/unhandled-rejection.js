const createReportFromErr = require('@bugsnag/core/lib/report-from-error')

let _handler
module.exports = {
  init: client => {
    if (!client.config.autoNotify) return
    _handler = err => {
      client.notify(createReportFromErr(err, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledPromiseRejection' }
      }), {}, (e, report) => {
        if (e) return client._logger('Failed to send report to Bugsnag')
        if (client.config.terminateOnUnhandledRejection) {
          client.config.onUnhandledError(err, report, client._logger)
        }
      })
    }
    process.on('unhandledRejection', _handler)
  },
  configSchema: {
    terminateOnUnhandledRejection: {
      defaultValue: () => true,
      validate: value => value === true || value === false,
      message: 'should be true|false'
    }
  },
  destroy: () => {
    process.removeListener('unhandledRejection', _handler)
  }
}
