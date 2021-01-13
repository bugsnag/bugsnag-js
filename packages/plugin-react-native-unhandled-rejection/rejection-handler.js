/*
* Automatically notifies Bugsnag when an unhandled promise rejection happens in React Native
*/

/* global __DEV__ */

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
        // adding our own onUnhandled callback means the default log message doesn't happen, so make it happen here
        if (typeof __DEV__ !== 'undefined' && __DEV__) logError(id, error)
      }
    })
    return () => rnPromise.disable()
  }
}

// this function is copied in from the promise module, since it's not exported and we can't reference it:
// https://github.com/then/promise/blob/91b7b4cb6ad0cacc1c70560677458fe0aac2fa67/src/rejection-tracking.js#L101-L107
function logError (id, error) {
  console.warn('Possible Unhandled Promise Rejection (id: ' + id + '):')
  var errStr = (error && (error.stack || error)) + ''
  errStr.split('\n').forEach(function (line) {
    console.warn('  ' + line)
  })
}
