const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const runCallbacks = require('@bugsnag/core/lib/callback-runner')

module.exports = {
  name: 'mainEventSync',
  load: client => {
    const onCallbackError = (err, cb) => {
      // errors in callbacks are tolerated but we want to log them out
      client._logger.error('Error occurred in onError callback, continuing anyway…')
      client._logger.error(err)
    }

    const getPayloadInfo = () => {
      return new Promise((resolve, reject) => {
        const event = new Event('BugsnagInternalError', 'Extracting event info from main process for event in renderer')
        event.app = {
          ...event.app,
          releaseStage: client._config.releaseStage,
          version: client._config.appVersion,
          type: client._config.appType
        }
        event.context = event.context || client._context
        event._metadata = { ...event._metadata, ...client._metadata }
        event._user = { ...event._user, ...client._user }
        event.breadcrumbs = client._breadcrumbs.slice()

        // run the event through just the internal onError callbacks
        const callbacks = client._cbs.e.filter(e => e._internal)
        runCallbacks(callbacks, event, onCallbackError, (err, shouldSend) => {
          if (err) onCallbackError(err)
          if (!shouldSend) return reject(new Error('Event not sent due to onError callback'))

          // extract just the properties we want from the event
          const { app, breadcrumbs, context, device, _metadata, user } = event
          resolve({ app, breadcrumbs, context, device, metadata: _metadata, user })
        })
      })
    }

    const dispatch = (event) => {
      return new Promise((resolve, reject) => {
        const originalSeverity = event.severity

        const callbacks = client._cbs.e.filter(e => !e._internal)
        runCallbacks(callbacks, event, onCallbackError, (err, shouldSend) => {
          if (err) onCallbackError(err)

          if (!shouldSend) {
            client._logger.debug('Event not sent due to onError callback')
          }

          if (client._config.enabledBreadcrumbTypes.includes('error')) {
            // only leave a crumb for the error if actually got sent
            Client.prototype.leaveBreadcrumb.call(client, event.errors[0].errorClass, {
              errorClass: event.errors[0].errorClass,
              errorMessage: event.errors[0].errorMessage,
              severity: event.severity
            }, 'error')
          }

          if (originalSeverity !== event.severity) {
            event._handledState.severityReason = { type: 'userCallbackSetSeverity' }
          }

          if (event.unhandled !== event._handledState.unhandled) {
            event._handledState.severityReason.unhandledOverridden = true
            event._handledState.unhandled = event.unhandled
          }

          if (client._session) {
            client._session._track(event)
            event._session = client._session
          }

          client._delivery.sendEvent({
            apiKey: event.apiKey || client._config.apiKey,
            notifier: client._notifier,
            events: [event]
          }, (err) => {
            if (err) return reject(err)
            resolve(event)
          })
        })
      })
    }
    return { getPayloadInfo, dispatch }
  }
}
