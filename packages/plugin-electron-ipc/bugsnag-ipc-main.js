module.exports = class BugsnagIpcMain {
  constructor (client) {
    this.client = client
    this.stateSync = client.getPlugin('stateSync')
  }

  leaveBreadcrumb (source) {
    return breadcrumb => this.client.leaveBreadcrumb(
      breadcrumb.name /* this is "name" not "type" due to breadcrumb.js's toJSON() function */,
      breadcrumb.metadata,
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

  updateContext (source) {
    return (...args) => this.stateSync.setContextFromSource(source)(...args)
  }

  addMetadata (source) {
    return (...args) => this.stateSync.addMetadataFromSource(source)(...args)
  }

  clearMetadata (source) {
    return (...args) => this.stateSync.clearMetadataFromSource(source)(...args)
  }

  updateUser (source) {
    return (...args) => this.stateSync.setUserFromSource(source)(...args)
  }

  dispatch (event) {
    // TODO
  }

  getPayloadInfo () {
    // TODO
  }

  toMap () {
    return new Map([
      ['leaveBreadcrumb', this.leaveBreadcrumb.bind(this)],
      ['startSession', this.startSession.bind(this)],
      ['pauseSession', this.pauseSession.bind(this)],
      ['resumeSession', this.resumeSession.bind(this)],
      ['updateContext', this.updateContext.bind(this)],
      ['addMetadata', this.addMetadata.bind(this)],
      ['clearMetadata', this.clearMetadata.bind(this)],
      ['updateUser', this.updateUser.bind(this)],
      ['dispatch', this.dispatch.bind(this)],
      ['getPayloadInfo', this.getPayloadInfo.bind(this)]
    ])
  }
}
