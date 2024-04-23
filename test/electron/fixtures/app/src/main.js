const { join } = require('path')
const {
  uncaughtException,
  unhandledRejection,
  crash,
  notify
} = require('./errors')
const Bugsnag = require('@bugsnag/electron/main')
const configFile = process.env.BUGSNAG_CONFIG || 'default'
// eslint-disable-next-line no-undef
const bugsnagConfig = __non_webpack_require__(`./${configFile}`)
const preloadFile = process.env.BUGSNAG_PRELOAD || 'default'

// eslint-disable-next-line no-undef
const config = { ...baseBugsnagConfig, ...bugsnagConfig() }

Bugsnag.start(config)

const { app, BrowserWindow, ipcMain } = require('electron')

Bugsnag.addFeatureFlag('from main at runtime', 'runtime 1')
Bugsnag.addOnError(event => {
  event.addFeatureFlags([
    { name: 'from main on error', variant: 'on error 1' }
  ])
})

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: false,
      // eslint-disable-next-line no-undef
      preload: join(__dirname, preloadRelativeDir, preloadFile, 'index.js')
    }
  })
  // win.webContents.openDevTools()

  // eslint-disable-next-line no-undef
  win.loadFile(join(__dirname, htmlRelativePath))
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('main-process-unhandled-promise-rejection', unhandledRejection)

ipcMain.on('main-process-uncaught-exception', uncaughtException)

ipcMain.on('main-process-notify', notify)

ipcMain.on('main-process-oversized', () => {
  function repeat (s, n) {
    var a = []
    while (a.length < n) {
      a.push(s)
    }
    return a.join('')
  }

  var big = {}
  var i = 0
  while (JSON.stringify(big).length < 2 * 10e5) {
    big['entry' + i] = repeat('long repetitive string', 1000)
    i++
  }
  Bugsnag.leaveBreadcrumb('big thing', big)
  notify()
})

ipcMain.on('main-process-crash', crash)

ipcMain.on('delayed-main-process-crash', () => setTimeout(() => crash(), 1000))

ipcMain.on('main-process-start-session', () => {
  Bugsnag.startSession()
})

ipcMain.on('main-process-console-log', (_event, ...args) => {
  console.log(...args)
})

ipcMain.on('mark-launch-complete', () => {
  Bugsnag.markLaunchComplete()
})

ipcMain.on('last-run-info-breadcrumb', () => {
  Bugsnag.leaveBreadcrumb('last-run-info', Bugsnag.lastRunInfo)
})

ipcMain.on('main-process-clear-feature-flags', () => {
  // clear feature flags in a new on error callback to also clear flags from other callbacks
  Bugsnag.addOnError(event => {
    event.clearFeatureFlags()
  })
})

ipcMain.on('main-process-clear-feature-flags-now', () => {
  Bugsnag.clearFeatureFlags()
})
