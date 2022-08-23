const Event = require('@bugsnag/core/event')
const Breadcrumb = require('@bugsnag/core/breadcrumb')
const runCallbacks = require('@bugsnag/core/lib/callback-runner')

module.exports = class BugsnagIpcMain {
  constructor (client) {
    this.client = client

    this.clientStateManager = client.getPlugin('clientStateManager')
    if (!this.clientStateManager) throw new Error('Expected @bugsnag/plugin-electron-client-state-manager to be loaded first')

    this.methodMap = this.toMap()

    // handle is used as a callback so ensure it is bound with the correct "this"
    this.handle = this.handle.bind(this)
    this.handleSync = this.handleSync.bind(this)
  }

  leaveBreadcrumb (breadcrumb) {
    return this.client.leaveBreadcrumb(
      breadcrumb.message,
      breadcrumb.metadata,
      breadcrumb.type
    )
  }

  update ({ context, user, metadata, features }) {
    return this.clientStateManager.bulkUpdate({ context, user, metadata, features })
  }

  dispatch (eventObject) {
    try {
      const event = new Event()

      // copy all properties from 'eventObject' to 'event'
      Object.keys(event)
        .filter(Object.hasOwnProperty.bind(event))
        .forEach(key => { event[key] = eventObject[key] })

      // rehydrate breadcrumbs so they get serialised properly (Breadcrumb class has a .toJSON() method)
      event.breadcrumbs = event.breadcrumbs.map(b =>
        new Breadcrumb(b.message, b.metadata, b.type, b.timestamp)
      )

      this._dispatch(event)
    } catch (e) {
      this.client._logger.error('Error dispatching event from renderer', e)
    }
  }

  _dispatch (event) {
    const originalSeverity = event.severity

    const callbacks = this.client._cbs.e.filter(e => !e._internal)
    runCallbacks(callbacks, event, this._onCallbackError, (err, shouldSend) => {
      if (err) this._onCallbackError(err)

      if (!shouldSend) {
        this.client._logger.debug('Event not sent due to onError callback')
        return
      }

      if (this.client._isBreadcrumbTypeEnabled('error')) {
        // only leave a crumb for the error if actually got sent
        this.client.leaveBreadcrumb(event.errors[0].errorClass, {
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

      if (this.client._session) {
        this.client._session._track(event)
        event._session = this.client._session
      }

      this.client._delivery.sendEvent({
        apiKey: event.apiKey || this.client._config.apiKey,
        notifier: this.client._notifier,
        events: [event]
      })
    })
  }

  getPayloadInfo () {
    return new Promise((resolve, reject) => {
      const event = new Event('BugsnagInternalError', 'Extracting event info from main process for event in renderer')
      event.app = {
        ...event.app,
        releaseStage: this.client._config.releaseStage,
        version: this.client._config.appVersion,
        type: this.client._config.appType
      }
      event.context = event.context || this.client._context
      event._metadata = { ...event._metadata, ...this.client._metadata }
      event._features.mergeFrom(this.client._features)
      event._user = { ...event._user, ...this.client._user }
      event.breadcrumbs = this.client._breadcrumbs.slice()

      // run the event through just the internal onError callbacks
      const callbacks = this.client._cbs.e.filter(e => e._internal)
      runCallbacks(callbacks, event, this._onCallbackError, (err, shouldSend) => {
        if (err) this._onCallbackError(err)
        if (!shouldSend) return resolve({ shouldSend: false })

        // extract just the properties we want from the event
        const { app, breadcrumbs, context, device, _metadata, _features, _user } = event
        resolve({ app, breadcrumbs, context, device, metadata: _metadata, features: _features.toJSON(), user: _user })
      })
    })
  }

  handle (_event, methodName, ...args) {
    return this.resolve(methodName, ...args)
  }

  handleSync (event, methodName, ...args) {
    event.returnValue = this.resolve(methodName, ...args)
  }

  resolve (methodName, ...args) {
    // lookup the method on the BugsnagIpcMain map
    const method = this.methodMap.get(methodName)
    if (!method) {
      this.client._logger.warn(`attempted to call IPC method named "${methodName}" which doesn't exist`)
      return
    }

    try {
      return method(...args.map(arg => typeof arg === 'undefined' ? undefined : JSON.parse(arg)))
    } catch (e) {
      this.client._logger.warn('IPC call failed', e)
    }
  }

  _onCallbackError (err) {
    // errors in callbacks are tolerated but we want to log them out
    this.client._logger.error('Error occurred in onError callback, continuing anyway…')
    this.client._logger.error(err)
  }

  toMap () {
    return new Map([
      ['leaveBreadcrumb', this.leaveBreadcrumb.bind(this)],
      ['startSession', this.client.startSession.bind(this.client)],
      ['pauseSession', this.client.pauseSession.bind(this.client)],
      ['resumeSession', this.client.resumeSession.bind(this.client)],
      ['update', this.update.bind(this)],
      ['getContext', this.client.getContext.bind(this.client)],
      ['setContext', this.client.setContext.bind(this.client)],
      ['addMetadata', this.client.addMetadata.bind(this.client)],
      ['clearMetadata', this.client.clearMetadata.bind(this.client)],
      ['getMetadata', this.client.getMetadata.bind(this.client)],
      ['addFeatureFlag', this.client.addFeatureFlag.bind(this.client)],
      ['addFeatureFlags', this.client.addFeatureFlags.bind(this.client)],
      ['clearFeatureFlag', this.client.clearFeatureFlag.bind(this.client)],
      ['clearFeatureFlags', this.client.clearFeatureFlags.bind(this.client)],
      ['getUser', this.client.getUser.bind(this.client)],
      ['setUser', this.client.setUser.bind(this.client)],
      ['dispatch', this.dispatch.bind(this)],
      ['getPayloadInfo', this.getPayloadInfo.bind(this)]
    ])
  }
}
