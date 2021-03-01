const { resolve } = require('path')
const { ipcMain, app } = require('electron')
const BugsnagIpcMain = require('./bugsnag-ipc-main')
const serializeConfigForRenderer = require('./lib/config-serializer')

module.exports = {
  load: (client) => {
    // pre serialise config outside of the sync IPC call so we avoid
    // unnecessary computation while the process is blocked
    const configStr = serializeConfigForRenderer(client._config)

    // configuration
    ipcMain.on('bugsnag::configure', (event, data) => {
      event.returnValue = configStr
    })

    // synchronisation calls
    const bugsnagIpcMainMap = (new BugsnagIpcMain(client)).toMap()
    ipcMain.handle('bugsnag::sync', (event, methodName, ...args) => {
      console.log('bugsnag ipc call received')
      const method = bugsnagIpcMainMap.get(methodName)
      if (!method) {
        client._logger.warn(`attempted to call IPC method named "${methodName}" which doesn't exist`)
        return
      }
      try {
        console.log(method, ...args.map(arg => typeof arg === 'undefined' ? undefined : JSON.parse(arg)))
        return method(...args.map(arg => typeof arg === 'undefined' ? undefined : JSON.parse(arg)))
      } catch (e) {
        client._logger.warn('IPC call failed', e)
      }
    })

    setPreload()
  }
}

const setPreload = () => {
  const bugsnagPreload = resolve(__dirname, 'preload.js')

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
