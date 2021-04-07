const Event = require('@bugsnag/core/event')
const Breadcrumb = require('@bugsnag/core/breadcrumb')

module.exports = class BugsnagIpcMain {
  constructor (client) {
    this.client = client

    this.stateSync = client.getPlugin('stateSync')
    if (!this.stateSync) throw new Error('Expected @bugsnag/plugin-electron-state-sync to be loaded first')

    this.mainEventSync = client.getPlugin('mainEventSync')
    if (!this.mainEventSync) throw new Error('Expected @bugsnag/plugin-electron-event-sync to be loaded first')

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

  update ({ context, user, metadata }) {
    return this.stateSync.bulkUpdate({ context, user, metadata })
  }

  dispatch (eventObject) {
    const event = new Event()

    // copy all properties from 'eventObject' to 'event'
    Object.keys(event)
      .filter(Object.hasOwnProperty.bind(event))
      .forEach(key => { event[key] = eventObject[key] })

    event.breadcrumbs = event.breadcrumbs.map(b => new Breadcrumb(b.message, b.metadata, b.type, b.timestamp))

    this.mainEventSync.dispatch(event)
  }

  getPayloadInfo () {
    return this.mainEventSync.getPayloadInfo()
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
      ['getUser', this.client.getUser.bind(this.client)],
      ['setUser', this.client.setUser.bind(this.client)],
      ['dispatch', this.dispatch.bind(this)],
      ['getPayloadInfo', this.getPayloadInfo.bind(this)]
    ])
  }
}
