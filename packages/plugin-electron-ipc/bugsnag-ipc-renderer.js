const { ipcRenderer } = require('electron')
const jsonStringify = require('@bugsnag/safe-json-stringify')

const CHANNEL_NAME = 'bugsnag::sync'
const safeInvoke = (method, ...args) => {
  return ipcRenderer.invoke(CHANNEL_NAME, method, ...args.map(arg => jsonStringify(arg)))
}

module.exports = class BugsnagIpcRenderer {
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

  updateMetadata (section, values) {
    return safeInvoke('updateMetadata', section, values)
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
