/*
* Automatically notifies Bugsnag when an unhandled promise rejection happens in React Native
*/

const rnPromise = require('promise/setimmediate/rejection-tracking')
const createEventFromErr = require('@bugsnag/core/lib/event-from-error')

module.exports = {
  init: (client) => {
    if (!client._config.autoDetectErrors || !client._config.autoDetectUnhandledRejections) return () => {}
    rnPromise.enable({
      allRejections: true,
      onUnhandled: (id, error) => {
        client.notify(createEventFromErr(error, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledPromiseRejection' }
        }))
      }
    })
    return () => rnPromise.disable()
  }
}
