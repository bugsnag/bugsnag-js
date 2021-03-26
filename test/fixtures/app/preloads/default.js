const Bugsnag = require('@bugsnag/electron')
Bugsnag.start()

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
  },
  mainProcessStartSession: () => {
    ipcRenderer.send('main-process-start-session')
  },
  mainProcessNotify: () => {
    ipcRenderer.send('main-process-notify')
  },
  notify: (err) => {
    Bugsnag.notify(err)
  },
  leaveCrumb: () => {
    Bugsnag.leaveBreadcrumb('missing auth token', { session: 'two-two' })
  }
})
