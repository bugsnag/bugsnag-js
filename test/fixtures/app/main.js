const { join } = require('path')
const Bugsnag = require('@bugsnag/electron')
const configFile = process.env.BUGSNAG_CONFIG || 'default'
// eslint-disable-next-line no-undef
const bugsnagConfig = __non_webpack_require__(`./${configFile}`)
const preloadFile = process.env.BUGSNAG_PRELOAD || 'default.js'

Bugsnag.start({
  // Base test server / automation config
  // eslint-disable-next-line no-undef
  ...baseBugsnagConfig,
  // Bugsnag config loaded from ./configs/<selection>
  ...bugsnagConfig()
})

const { app, BrowserWindow, ipcMain } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      // eslint-disable-next-line no-undef
      preload: join(__dirname, preloadRelativeDir, preloadFile),
      nodeIntegration: false
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

ipcMain.on('main-process-unhandled-promise-rejection', () => {
  Promise.reject(new TypeError('invalid'))
})

ipcMain.on('main-process-uncaught-exception', () => {
  // eslint-disable-next-line
  foo()
})

ipcMain.on('main-process-crash', () => {
  process.crash()
})

ipcMain.on('main-process-start-session', () => {
  Bugsnag.startSession()
})
