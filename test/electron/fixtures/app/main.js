const { join } = require('path')
const {
  uncaughtException,
  unhandledRejection,
  crash,
  notify
} = require('./src/errors')
const Bugsnag = require('@bugsnag/electron')
const { plugin: PluginClientStatePersistence, NativeClient } = require('@bugsnag/plugin-electron-client-state-persistence')
const configFile = process.env.BUGSNAG_CONFIG || 'default'
// eslint-disable-next-line no-undef
const bugsnagConfig = __non_webpack_require__(`./${configFile}`)
const preloadFile = process.env.BUGSNAG_PRELOAD || 'default.js'

// eslint-disable-next-line no-undef
const config = { ...baseBugsnagConfig, ...bugsnagConfig() }

// enable the client state persistence plugin to ensure it doesn't crash
config.plugins = (config.plugins || []).concat(PluginClientStatePersistence(NativeClient))

Bugsnag.start(config)

const { app, BrowserWindow, ipcMain } = require('electron')

NativeClient.install(
  join(app.getPath('userCache'), 'bugsnag', Bugsnag._client._config.apiKey, 'native'),
  Bugsnag._client._config.maxBreadcrumbs
)

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

ipcMain.on('main-process-unhandled-promise-rejection', unhandledRejection)

ipcMain.on('main-process-uncaught-exception', uncaughtException)

ipcMain.on('main-process-notify', notify)

ipcMain.on('main-process-crash', crash)

ipcMain.on('main-process-start-session', () => {
  Bugsnag.startSession()
})

ipcMain.on('main-process-console-log', (_event, ...args) => {
  console.log(...args)
})
