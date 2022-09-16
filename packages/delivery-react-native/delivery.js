const derecursify = require('@bugsnag/core/lib/derecursify')

module.exports = (client, NativeClient) => ({
  sendEvent: (payload, cb = () => {}) => {
    const event = payload.events[0]
    let nativeStack
    if (event.originalError) {
      if (event.originalError.nativeStackIOS) {
        nativeStack = event.originalError.nativeStackIOS
      } else if (event.originalError.nativeStackAndroid) {
        nativeStack = event.originalError.nativeStackAndroid
      }
    }
    client._logger.warn('Calling RN dispatch')
    NativeClient.dispatch({
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
      metadata: derecursify(event._metadata),
      groupingHash: event.groupingHash,
      apiKey: event.apiKey,
      featureFlags: event.toJSON().featureFlags,
      nativeStack: nativeStack
    }).then(() => cb()).catch(cb)
    client._logger.warn('Finished calling RN dispatch')
  },
  sendSession: () => {
    client._logger.warn('@bugsnag/delivery-react-native sendSession() should never be called', new Error().stack)
  }
})
