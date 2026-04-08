const derecursify = require('@bugsnag/core/lib/derecursify')

module.exports = (client, NativeClient) => ({
  sendEvent: (payload, cb = () => {}) => {
    const event = payload.events[0]

    if (event.originalError) {
      // extract native stacktrace from originalError if available
      let nativeErrorMessage, nativeStack
      if (event.originalError.nativeStackIOS) {
        // old arch ios
        nativeErrorMessage = event.originalError.message
        nativeStack = event.originalError.nativeStackIOS
      } else if (event.originalError.nativeStackAndroid) {
        // old arch android
        nativeErrorMessage = event.originalError.message
        nativeStack = event.originalError.nativeStackAndroid
      } else if (event.originalError.cause && event.originalError.cause.stackSymbols) {
        // new arch ios
        nativeErrorMessage = event.originalError.cause.message
        nativeStack = event.originalError.cause.stackSymbols
      } else if (event.originalError.cause && event.originalError.cause.stackElements) {
        // new arch android
        nativeErrorMessage = event.originalError.cause.message
        nativeStack = event.originalError.cause.stackElements
      }

      if (nativeErrorMessage && nativeStack) {
      // add the native stack to the corresponding error in the event payload
        const nativeError = event.errors.find(err => err.errorMessage === nativeErrorMessage)

        if (nativeError) {
          nativeError.nativeStack = nativeStack
        }
      }
    }

    const isTurboModuleEnabled = global.RN$Bridgeless || global.__turboModuleProxy != null

    const eventPayload = {
      errors: event.errors,
      severity: event.severity,
      severityReason: event._handledState.severityReason,
      unhandled: event.unhandled,
      app: event.app,
      device: event.device,
      threads: event.threads,
      breadcrumbs: derecursify(event.breadcrumbs),
      context: event.context,
      user: event._user,
      request: event.request,
      response: event.response,
      metadata: derecursify(event._metadata),
      groupingHash: event.groupingHash,
      groupingDiscriminator: event._groupingDiscriminator,
      apiKey: event.apiKey,
      featureFlags: event.toJSON().featureFlags,
      correlation: event._correlation
    }

    if (isTurboModuleEnabled) {
      NativeClient.dispatch(eventPayload)
      cb()
    } else {
      NativeClient.dispatchAsync(eventPayload).then(() => cb()).catch(cb)
    }
  },
  sendSession: () => {
    client._logger.warn('@bugsnag/delivery-react-native sendSession() should never be called', new Error().stack)
  }
})
