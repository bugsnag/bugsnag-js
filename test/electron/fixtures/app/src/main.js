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
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // eslint-disable-next-line no-undef
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    }
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // and load the index.html of the app.
  // eslint-disable-next-line no-undef
  mainWindow.loadFile(join(__dirname, htmlRelativePath))
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
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
