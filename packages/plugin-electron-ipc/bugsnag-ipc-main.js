module.exports = class BugsnagIpcMain {
  constructor (client) {
    this.client = client

    this.stateSync = client.getPlugin('stateSync')
    if (!this.stateSync) throw new Error('Expected @bugsnag/plugin-electron-state-sync to be loaded first')

    this.methodMap = this.toMap()

    // handle is used as a callback so ensure it is bound with the correct "this"
    this.handle = this.handle.bind(this)
  }

  leaveBreadcrumb () {
    return breadcrumb => this.client.leaveBreadcrumb(
      breadcrumb.name /* this is "name" not "type" due to breadcrumb.js's toJSON() function */,
      breadcrumb.metaData, /* again, this "metaData" not "metadata" due to the fact this is serialised for API compatibility */
      breadcrumb.type
    )
  }

  startSession (source) {
    return () => this.client.startSession()
  }

  pauseSession (source) {
    return () => this.client.pauseSession()
  }

  resumeSession (source) {
    return () => this.client.resumeSession()
  }

  update (source) {
    return ({ context, user, metadata }) => {
      this.stateSync.updateFromSource(source)({ context, user, metadata })
    }
  }

  updateContext (source) {
    return (update) => this.stateSync.updateContextFromSource(source)(update)
  }

  updateUser (source) {
    return (update) => this.stateSync.updateUserFromSource(source)(update)
  }

  updateMetadata (source) {
    return (update) => this.stateSync.updateMetadataFromSource(source)(update)
  }

  dispatch (event) {
    // TODO
  }

  getPayloadInfo () {
    // TODO
  }

  handle (event, methodName, ...args) {
    this.client._logger.debug('IPC call received', methodName, args)

    // lookup the method on the BugsnagIpcMain map
    const method = this.methodMap.get(methodName)
    if (!method) {
      this.client._logger.warn(`attempted to call IPC method named "${methodName}" which doesn't exist`)
      return
    }

    try {
      // call the method, passing in the event sender (WebContents instance)
      // so that change events only get propagated out to other renderers
      return method(event.sender)(...args.map(arg => typeof arg === 'undefined' ? undefined : JSON.parse(arg)))
    } catch (e) {
      this.client._logger.warn('IPC call failed', e)
    }
  }

  toMap () {
    return new Map([
      ['leaveBreadcrumb', this.leaveBreadcrumb.bind(this)],
      ['startSession', this.startSession.bind(this)],
      ['pauseSession', this.pauseSession.bind(this)],
      ['resumeSession', this.resumeSession.bind(this)],
      ['update', this.update.bind(this)],
      ['updateContext', this.updateContext.bind(this)],
      ['updateMetadata', this.updateMetadata.bind(this)],
      ['updateUser', this.updateUser.bind(this)],
      ['dispatch', this.dispatch.bind(this)],
      ['getPayloadInfo', this.getPayloadInfo.bind(this)]
    ])
  }
}
