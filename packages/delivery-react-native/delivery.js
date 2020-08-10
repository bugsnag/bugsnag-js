module.exports = (client, NativeClient) => ({
  sendEvent: (payload, cb = () => {}) => {
    const event = payload.events[0]
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
      apiKey: event.apiKey
    }).then(() => cb()).catch(cb)
  },
  sendSession: () => {
    client._logger.warn('@bugsnag/delivery-react-native sendSession() should never be called', new Error().stack)
  }
})
