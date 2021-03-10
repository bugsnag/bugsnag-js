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

  leaveBreadcrumb (...args) {
    return safeInvoke('leaveBreadcrumb', ...args)
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

  updateContext (...args) {
    return safeInvoke('updateContext', ...args)
  }

  addMetadata (...args) {
    return safeInvoke('addMetadata', ...args)
  }

  clearMetadata (...args) {
    return safeInvoke('clearMetadata', ...args)
  }

  updateUser (...args) {
    return safeInvoke('updateUser', ...args)
  }

  dispatch (event) {
    return safeInvoke('dispatch', event)
  }

  getPayloadInfo () {
    return safeInvoke('getPayloadInfo')
  }
}
