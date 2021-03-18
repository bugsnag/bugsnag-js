const { ipcRenderer } = require('electron')
const jsonStringify = require('@bugsnag/safe-json-stringify')
const { CHANNEL_MAIN_TO_RENDERER, CHANNEL_RENDERER_TO_MAIN } = require('./lib/constants')

const safeInvoke = (method, ...args) => {
  return ipcRenderer.invoke(CHANNEL_RENDERER_TO_MAIN, method, ...args.map(arg => jsonStringify(arg)))
}

const BugsnagIpcRenderer = {
  listen (cb) {
    ipcRenderer.on(CHANNEL_MAIN_TO_RENDERER, (event, payload) => cb(event, JSON.parse(payload)))
  },

  updateContext (context) {
    return safeInvoke('updateContext', { context })
  },

  updateMetadata (section, values) {
    return safeInvoke('updateMetadata', { section, values })
  },

  updateUser (user) {
    return safeInvoke('updateUser', { user })
  },

  leaveBreadcrumb (...args) {
    return safeInvoke('leaveBreadcrumb', ...args)
  },

  startSession () {
    return safeInvoke('startSession')
  },

  pauseSession () {
    return safeInvoke('pauseSession')
  },

  resumeSession () {
    return safeInvoke('resumeSession')
  },

  dispatch (event) {
    return safeInvoke('dispatch', event)
  },

  getPayloadInfo () {
    return safeInvoke('getPayloadInfo')
  }
}

module.exports = BugsnagIpcRenderer
