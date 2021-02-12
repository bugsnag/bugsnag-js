const { contextBridge, ipcRenderer } = require('electron')


contextBridge.exposeInMainWorld('RunnerAPI', {
  mainProcessCrash: function() {
    ipcRenderer.send('main-process-crash')
  },
  mainProcessUnhandledPromiseRejection: function() {
    ipcRenderer.send('main-process-unhandled-promise-rejection')
  },
  mainProcessUncaughtException: function() {
    ipcRenderer.send('main-process-uncaught-exception')
  },
})
