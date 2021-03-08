const { ipcRenderer } = require('electron')
const jsonStringify = require('@bugsnag/safe-json-stringify')

const OUTBOUND_CHANNEL_NAME = 'bugsnag::renderer-to-main-sync'
const safeInvoke = (method, ...args) => {
  return ipcRenderer.invoke(OUTBOUND_CHANNEL_NAME, method, ...args.map(arg => jsonStringify(arg)))
}

const INBOUND_CHANNEL_NAME = 'bugsnag::main-to-renderer-sync'

module.exports = class BugsnagIpcRenderer {
  listen (cb) {
    ipcRenderer.on(INBOUND_CHANNEL_NAME, cb)
  }

  leaveBreadcrumb (breadcrumb) {
    return safeInvoke('leaveBreadcrumb', breadcrumb)
  }

  startSession () {
    return safeInvoke('startSession')
  }

  pauseSession () {
    return safeInvoke('pauseSession')
  }

  resumeSession () {
    return safeInvoke('resumeSession')
  }

  updateContext (ctx) {
    return safeInvoke('updateContext', ctx)
  }

  addMetadata (section, keyOrValues, value) {
    return safeInvoke('addMetadata', section, keyOrValues, value)
  }

  clearMetadata (section, key) {
    return safeInvoke('clearMetadata', section, key)
  }

  updateUser (id, name, email) {
    return safeInvoke('updateUser', id, name, email)
  }

  dispatch (event) {
    return safeInvoke('dispatch', event)
  }

  getPayloadInfo () {
    return safeInvoke('getPayloadInfo')
  }
}
