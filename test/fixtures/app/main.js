const { app, BrowserWindow, ipcMain } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      // https://github.com/electron-userland/spectron/issues/720
      // https://github.com/electron/electron/blob/a75cd89d2a64adccf46d6b8e0ae4eb59ba245c8b/docs/breaking-changes.md#default-changed-enableremotemodule-defaults-to-false
      enableRemoteModule: true,
    }
  })

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
  new Promise((_, reject) => {
    reject(new TypeError("invalid"))
  })
})

ipcMain.on('main-process-uncaught-exception', () => {
  foo()
})

ipcMain.on('main-process-crash', () => {
  process.crash()
})
