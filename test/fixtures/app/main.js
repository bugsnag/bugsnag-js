const { join } = require('path')
const Bugsnag = require('@bugsnag/electron')

const configFile = process.env.BUGSNAG_CONFIG || 'default'
const config = require(`./configs/${configFile}`)()

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_ENDPOINT_NOTIFY,
    sessions: process.env.BUGSNAG_ENDPOINT_SESSIONS,
    minidumps: process.env.BUGSNAG_ENDPOINT_MINIDUMPS
  },
  ...config
})

const preloadFile = process.env.BUGSNAG_PRELOAD || 'default.js'

const { app, BrowserWindow, ipcMain } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: join(app.getAppPath(), 'preloads', preloadFile),
      nodeIntegration: false
    }
  })
  // win.webContents.openDevTools()

  win.loadFile('index.html')
}

// prevent pop-up dialogs for exceptions
process.on('uncaughtException', () => {})

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
