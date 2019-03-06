/*
* Automatically notifies Bugsnag when an unhandled promise rejection happens in React Native
*/

const rnPromise = require('promise/setimmediate/rejection-tracking')
const createReportFromErr = require('@bugsnag/core/lib/report-from-error')

module.exports = {
  init: (client) => {
    if (!client.config.autoNotify) return () => {}
    rnPromise.enable({
      allRejections: true,
      onUnhandled: (id, error) => {
        client.notify(createReportFromErr(error, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledPromiseRejection' }
        }))
      }
    })
    return () => rnPromise.disable()
  }
}
