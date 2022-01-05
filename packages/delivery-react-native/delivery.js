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
    NativeClient.dispatch({
      errors: event.errors,
      severity: event.severity,
      severityReason: event._handledState.severityReason,
      unhandled: event.unhandled,
      app: event.app,
      device: event.device,
      threads: event.threads,
      breadcrumbs: event.breadcrumbs,
      context: event.context,
      user: event._user,
      metadata: event._metadata,
      groupingHash: event.groupingHash,
      apiKey: event.apiKey,
      featureFlags: event.toJSON().featureFlags,
      nativeStack: nativeStack
    }).then(() => cb()).catch(cb)
  },
  sendSession: () => {
    client._logger.warn('@bugsnag/delivery-react-native sendSession() should never be called', new Error().stack)
  }
})
