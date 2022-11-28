/*
* Automatically notifies Bugsnag when React Native's global error handler is called
*/

module.exports = (ErrorUtils = global.ErrorUtils) => ({
  load: (client) => {
    client._logger.warn('Adding error handler')
    if (!client._config.autoDetectErrors) return
    if (!client._config.enabledErrorTypes.unhandledExceptions) return
    if (!ErrorUtils) {
      client._logger.warn('ErrorUtils is not defined. Can’t attach a global error handler.')
      return
    }
    const prev = ErrorUtils.getGlobalHandler()

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      client._logger.warn('Creating event.')
      const event = client.Event.create(error, true, {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' }
      }, 'ErrorUtils globalHandler', 1)
      event.attemptImmediateDelivery = false
      client._notify(event, (err) => {
        console.log('GlobalHanlder onError', err)
      }, () => {
        client._logger.warn('delegating to previous Global Handler')
        if (typeof prev === 'function') prev(error, isFatal)
      })
    })
  }
})
