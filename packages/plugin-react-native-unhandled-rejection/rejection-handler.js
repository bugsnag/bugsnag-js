/*
* Automatically notifies Bugsnag when an unhandled promise rejection happens in React Native
*/

const rnPromise = require('promise/setimmediate/rejection-tracking')

module.exports = {
  load: (client) => {
    if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return () => {}
    rnPromise.enable({
      allRejections: true,
      onUnhandled: (id, error) => {
        const event = client.Event.create(error, false, {
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
