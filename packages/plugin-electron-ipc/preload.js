// preloads run in devtools panes too, but we don't want to run there
if (document.location.protocol === 'devtools:') return

const { ipcRenderer, contextBridge } = require('electron')
const BugsnagIpcRenderer = require('./bugsnag-ipc-renderer')
const { CHANNEL_CONFIG } = require('./lib/constants')

// one sync call is required on startup to get the main process config
const config = ipcRenderer.sendSync(CHANNEL_CONFIG)
if (!config) throw new Error('Bugsnag was not started in the main process before browser windows were created')

const bugsnagIpcRenderer = new BugsnagIpcRenderer()

// attach config to the exposed interface
bugsnagIpcRenderer.config = JSON.parse(config)

// expose Bugsnag as a global object for the browser
try {
  // assume contextIsolation=true
  contextBridge.exposeInMainWorld('__bugsnag_ipc__', bugsnagIpcRenderer)
} catch (e) {
  // fallback to directly assigning to the window
  window.__bugsnag_ipc__ = bugsnagIpcRenderer
}
