const domain = require('domain') // eslint-disable-line
const createReportFromErr = require('@bugsnag/core/lib/report-from-error')

module.exports = {
  name: 'contextualize',
  init: client => {
    const contextualize = (fn, opts) => {
      // capture a stacktrace in case resulting errors have nothing
      // see @bugsnag/plugin-intercept/intercept.js for detailed explanation
      const stack = (new Error()).stack.split('\n').slice(2).join('\n')

      const dom = domain.create()
      dom.on('error', err => {
        if (err.stack) {
          const lines = err.stack.split('\n')
          if (lines.length === 1 || (lines.length === 2 && /at Error \(native\)/.test(lines[1]))) {
            err.stack = `${lines[0]}\n${stack}`
          }
        }
        const report = createReportFromErr(err, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledException' }
        })
        client.notify(report, opts, (e, report) => {
          if (e) return client._logger('Failed to send report to Bugsnag')
          client.config.onUncaughtException(err, report, client._logger)
        })
      })
      process.nextTick(() => dom.run(fn))
    }

    return contextualize
  }
}
