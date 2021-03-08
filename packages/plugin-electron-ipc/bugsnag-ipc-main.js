module.exports = class BugsnagIpcMain {
  constructor (client) {
    this.client = client
    this.stateSync = client.getPlugin('stateSync')
  }

  leaveBreadcrumb (breadcrumb) {
    return source => this.client.leaveBreadcrumb(
      breadcrumb.name /* this is "name" not "type" due to breadcrumb.js's toJSON() function */,
      breadcrumb.metadata,
      breadcrumb.type
    )
  }

  startSession () {
    return source => this.client.startSession()
  }

  pauseSession () {
    return source => this.client.pauseSession()
  }

  resumeSession () {
    return source => this.client.resumeSession()
  }

  updateContext (ctx) {
    return source => this.stateSync.setContextFromSource(source)(ctx)
  }

  addMetadata (section, keyOrValues, value) {
    return source => this.stateSync.addMetadataFromSource(source)(section, keyOrValues, value)
  }

  clearMetadata (section, key) {
    return source => this.stateSync.clearMetadataFromSource(source)(section, key)
  }

  updateUser (id, name, email) {
    return source => this.stateSync.setUserFromSource(source)(id, name, email)
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
