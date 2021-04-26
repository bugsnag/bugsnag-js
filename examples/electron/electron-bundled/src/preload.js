const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('__bugsnag_example_ipc__', {
  sendMainHandled: () => {
    ipcRenderer.send('bugsnag-handled-error')
  },
  sendMainUnhandled: () => {
    ipcRenderer.send('bugsnag-unhandled-error')
  },
  sendMainRejection: () => {
    ipcRenderer.send('bugsnag-promise-rejection')
  }
})
