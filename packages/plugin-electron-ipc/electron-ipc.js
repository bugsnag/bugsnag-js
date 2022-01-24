const { resolve } = require('path')
const { ipcMain, app } = require('electron')
const BugsnagIpcMain = require('./bugsnag-ipc-main')
const serializeConfigForRenderer = require('./lib/config-serializer')
const { CHANNEL_CONFIG, CHANNEL_RENDERER_TO_MAIN, CHANNEL_RENDERER_TO_MAIN_SYNC } = require('./lib/constants')

module.exports = {
  load: (client) => {
    /* configuration requests from renderers */

    // pre serialise config outside of the sync IPC call so we avoid unnecessary computation while the process is blocked
    let configStr
    const updateConfigStr = () => {
      configStr = serializeConfigForRenderer(client._config, client._metadata, client._features, client.getUser(), client.getContext())
    }
    updateConfigStr()

    // this callback returns the main client's configuration to renderer so it can start its own client
    ipcMain.on(CHANNEL_CONFIG, (event, data) => {
      // the renderer blocks until this function returns a value
      event.returnValue = configStr
    })

    /* synchronisation from renderers */

    const bugsnagIpcMain = new BugsnagIpcMain(client)

    // delegate all method calls to the BugsnagIpcMain class's handle method
    ipcMain.handle(CHANNEL_RENDERER_TO_MAIN, bugsnagIpcMain.handle)
    ipcMain.on(CHANNEL_RENDERER_TO_MAIN_SYNC, bugsnagIpcMain.handleSync)

    setPreload()
  }
}

const setPreload = () => {
  const bugsnagPreload = resolve(__dirname, 'dist', 'preload.bundle.js')

  // for every session created, insert Bugsnag's preload script
  app.on('session-created', session => {
    // setPreloads replaces any existing value, so check the existing value first
    const existingPreloads = session.getPreloads()
    session.setPreloads([bugsnagPreload, ...existingPreloads])

    // ensure our preload is never replaced with subsequent setPreloads calls
    const setPreloads = session.setPreloads
    session.setPreloads = (...args) => {
      // if an invalid (non-array) parameter is passed, send it through to the
      // original method to let that raise an error in the default way
      if (!Array.isArray(args[0])) setPreloads.call(session, ...args)
      setPreloads.call(session, [bugsnagPreload, ...args[0]])
    }
  })
}
