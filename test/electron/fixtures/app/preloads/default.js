const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('RunnerAPI', {
  rendererConfig: JSON.parse(process.env.BUGSNAG_RENDERER_CONFIG || '{}'),
  mainProcessCrash: () => {
    ipcRenderer.send('main-process-crash')
  },
  mainProcessUnhandledPromiseRejection: () => {
    ipcRenderer.send('main-process-unhandled-promise-rejection')
  },
  mainProcessUncaughtException: () => {
    ipcRenderer.send('main-process-uncaught-exception')
  },
  mainProcessStartSession: () => {
    ipcRenderer.send('main-process-start-session')
  },
  mainProcessNotify: () => {
    ipcRenderer.send('main-process-notify')
  },
  mainProcessLog: (...args) => {
    ipcRenderer.send('main-process-console-log', ...args)
  },
  markLaunchComplete: () => {
    ipcRenderer.send('mark-launch-complete')
  },
  mainProcessLastRunInfo: () => {
    ipcRenderer.send('last-run-info-breadcrumb')
  },
  preloadStart: Date.now()
})
