const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('RunnerAPI', {
  mainProcessCrash: () => {
    ipcRenderer.send('main-process-crash')
  },
  mainProcessUnhandledPromiseRejection: () => {
    ipcRenderer.send('main-process-unhandled-promise-rejection')
  },
  mainProcessUncaughtException: () => {
    ipcRenderer.send('main-process-uncaught-exception')
  }
})
