/*
* Automatically notifies Bugsnag when an unhandled promise rejection happens in React Native
*/

/* global __DEV__ */

const rnPromise = require('promise/setimmediate/rejection-tracking')

module.exports = {
  load: (client) => {
    // Do not attach any listeners if autoDetectErrors is disabled or unhandledRejections are not an enabled error type
    if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return () => { }

    // Check if Hermes is available and is being used for promises
    // React Native v0.63 and v0.64 include global.HermesInternal but not 'hasPromise'
    if (global?.HermesInternal?.hasPromise?.() && global.HermesInternal.enablePromiseRejectionTracker) {
      global.HermesInternal.enablePromiseRejectionTracker({
        allRejections: true,
        onUnhandled: (id, rejection = {}) => {
          const event = client.Event.create(rejection, false, {
            severity: 'error',
            unhandled: true,
            severityReason: { type: 'unhandledPromiseRejection' }
          }, 'promise rejection tracking', 1)

          client._notify(event)

          // adding our own onUnhandled callback means the default handler doesn't get called, so make it happen here
          if (typeof __DEV__ !== 'undefined' && __DEV__) rnInternalOnUnhandled(id, rejection)
        }
      })

      return () => { }
    }

    // Otherwise, attach notifier to 'default' promise
    rnPromise.enable({
      allRejections: true,
      onUnhandled: (id, error) => {
        const event = client.Event.create(error, false, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledPromiseRejection' }
        }, 'promise rejection tracking', 1)
        client._notify(event)
        // adding our own onUnhandled callback means the default handler doesn't get called, so make it happen here
        if (typeof __DEV__ !== 'undefined' && __DEV__) rnInternalOnUnhandled(id, error)
      }
    })

    return () => rnPromise.disable()
  }
}

// This is a direct copy (with flow types removed) from RN internal code. In v0.64+ it is possible to reference, but in
// older versions we can't access it so simply have to copy it.
// https://github.com/facebook/react-native/blob/4409642811c787052e0baeb92e2679a96002c1e3/Libraries/Promise.js#L21-L46
const rnInternalOnUnhandled = (id, rejection) => {
  let message
  let stack

  const stringValue = Object.prototype.toString.call(rejection)
  if (stringValue === '[object Error]') {
    message = Error.prototype.toString.call(rejection)
    const error = rejection
    stack = error.stack
  } else {
    try {
      message = require('pretty-format')(rejection)
    } catch {
      message =
        typeof rejection === 'string'
          ? rejection
          : JSON.stringify(rejection)
    }
  }

  const warning =
    `Possible Unhandled Promise Rejection (id: ${id}):\n` +
    `${message || ''}\n` +
    (stack == null ? '' : stack)
  console.warn(warning)
}
