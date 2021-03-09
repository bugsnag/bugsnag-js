const { ipcRenderer } = require('electron')
const jsonStringify = require('@bugsnag/safe-json-stringify')
const { CHANNEL_MAIN_TO_RENDERER, CHANNEL_RENDERER_TO_MAIN } = require('./lib/constants')

const safeInvoke = (method, ...args) => {
  return ipcRenderer.invoke(CHANNEL_RENDERER_TO_MAIN, method, ...args.map(arg => jsonStringify(arg)))
}

module.exports = class BugsnagIpcRenderer {
  listen (cb) {
    ipcRenderer.on(CHANNEL_MAIN_TO_RENDERER, (event, payload) => cb(event, JSON.parse(payload)))
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
