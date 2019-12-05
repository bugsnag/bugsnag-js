/*
* Automatically notifies Bugsnag when an unhandled promise rejection happens in React Native
*/

const rnPromise = require('promise/setimmediate/rejection-tracking')

module.exports = {
  init: (client) => {
    if (!client._config.autoDetectErrors || !client._config.autoDetectUnhandledRejections) return () => {}
    rnPromise.enable({
      allRejections: true,
      onUnhandled: (id, error) => {
        const event = client.BugsnagEvent.create(error, false, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledPromiseRejection' }
        }, 'promise rejection tracking', 1)
        client._notify(event)
      }
    })
    return () => rnPromise.disable()
  }
}
