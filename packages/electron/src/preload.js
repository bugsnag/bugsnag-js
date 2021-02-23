// preloads run in devtools panes too, but we don't want to run there
if (document.location.protocol === 'devtools:') return

const { ipcRenderer, contextBridge } = require('electron')

// one sync call is required on startup to get the main process config
const config = ipcRenderer.sendSync('bugsnag::sync', { method: 'configure', args: [] })
if (!config) throw new Error('Bugsnag was not started in the main process before browser windows were created')

const BugsnagIpcSender = {
  config: JSON.parse(config)

  // IPC methods will be defined here

  // notify: () => {}
  // leaveBreadcrumb: () => {}
  // updateContext: (ctx) => {}
  // updateUser: () => {}

  /* etc. */
}

// expose Bugsnag as a global object for the browser
try {
  // assume contextIsolation=true
  contextBridge.exposeInMainWorld('__bugsnag_ipc__', BugsnagIpcSender)
} catch (e) {
  // fallback to directly assigning to the window
  window.__bugsnag_ipc__ = BugsnagIpcSender
}
