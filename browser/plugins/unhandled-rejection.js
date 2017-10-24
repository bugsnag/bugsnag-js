const ErrorStackParser = require('error-stack-parser')
const hasStack = require('../../base/lib/has-stack')

/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */

module.exports = {
  name: 'unhandled rejection',
  init: (client, BugsnagReport) => {
    // only attach for browsers that suppport promises
    if (!('onunhandledrejection' in window)) return

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledPromiseRejection' } }

      let report
      if (error && hasStack(error)) {
        // if it quacks like an Error…
        report = new BugsnagReport(error.name, error.message, ErrorStackParser.parse(error), handledState)
      } else {
        // if it doesn't…
        const msg = typeof error === 'string' ? error : 'Unhandled promise rejection'
        report = new BugsnagReport('UnhandledRejection', msg, [], handledState)
        // stuff the rejection reason into metaData, it could be useful
        report.updateMetaData('promise', 'rejection reason', error)
      }

      client.notify(report)
    })
  }
}
