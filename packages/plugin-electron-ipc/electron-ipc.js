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
    ipcMain.handle('bugsnag::renderer-to-main-sync', (event, methodName, ...args) => {
      client._logger.debug('IPC call received', methodName, args)
      const method = bugsnagIpcMainMap.get(methodName)
      if (!method) {
        client._logger.warn(`attempted to call IPC method named "${methodName}" which doesn't exist`)
        return
      }
      try {
        method(...args.map(arg => typeof arg === 'undefined' ? undefined : JSON.parse(arg)))(event.sender)
      } catch (e) {
        client._logger.warn('IPC call failed', e)
      }
    })

    // propagate changes out to renderers
    client.getPlugin('stateSync').emitter.on('UserUpdate', (payload, source) => propagateEventToRenderers('UserUpdate', payload, source))
    client.getPlugin('stateSync').emitter.on('ContextUpdate', (payload, source) => propagateEventToRenderers('ContextUpdate', payload, source))
    client.getPlugin('stateSync').emitter.on('AddMetadata', (payload, source) => propagateEventToRenderers('AddMetadata', payload, source))
    client.getPlugin('stateSync').emitter.on('ClearMetadata', (payload, source) => propagateEventToRenderers('ClearMetadata', payload, source))

    // keep track of the renderers in existence
    const renderers = new Set()
    app.on('web-contents-created', (event, webContents) => {
      client._logger.debug(`Renderer #${webContents.id} created`)
      // if you send data to a webContents instance before it has emitted this event, it will crash
      webContents.on('did-start-loading', () => renderers.add(webContents))
      webContents.on('destroy', () => {
        client._logger.debug(`Renderer #${webContents.id} destroyed`)
        renderers.delete(webContents)
      })
    })

    const propagateEventToRenderers = (type, payload, source) => {
      client._logger.debug('Propagating change event to renderers')
      for (const renderer of renderers) {
        // source=null when the event was triggered by the main process
        if (source === null || renderer.id !== source.id) {
          client._logger.debug(`Sending change event to renderer #${renderer.id}`)
          renderer.send('bugsnag::main-to-renderer-sync', { type, payload })
        } else {
          client._logger.debug(`Skipping renderer #${renderer.id} because it is the source of the event`)
        }
      }
    }

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
