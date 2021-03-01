module.exports = class BugsnagIpcMain {
  constructor (client) {
    this.client = client
  }

  leaveBreadcrumb (breadcrumb) {
    return this.client.leaveBreadcrumb(
      breadcrumb.name /* this is "name" not "type" due to breadcrumb.js's toJSON() function */,
      breadcrumb.metadata,
      breadcrumb.type
    )
  }

  startSession () {
    return this.client.startSession()
  }

  pauseSession () {
    return this.client.pauseSession()
  }

  resumeSession () {
    return this.client.resumeSession()
  }

  updateContext (ctx) {
    return this.client.setContext(ctx)
  }

  updateMetadata (section, values) {
    return this.client.addMetadata(section, values)
  }

  clearMetadata (section, key) {
    return this.client.clearMetadata(section, key)
  }

  updateUser (id, name, email) {
    return this.client.setUser(id, name, email)
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
      ['updateMetadata', this.updateMetadata.bind(this)],
      ['clearMetadata', this.clearMetadata.bind(this)],
      ['updateUser', this.updateUser.bind(this)],
      ['dispatch', this.dispatch.bind(this)],
      ['getPayloadInfo', this.getPayloadInfo.bind(this)]
    ])
  }
}
