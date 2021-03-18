const { resolve } = require('path')
const { ipcMain, app } = require('electron')
const BugsnagIpcMain = require('./bugsnag-ipc-main')
const serializeConfigForRenderer = require('./lib/config-serializer')
const { CHANNEL_CONFIG, CHANNEL_MAIN_TO_RENDERER, CHANNEL_RENDERER_TO_MAIN } = require('./lib/constants')
const jsonStringify = require('@bugsnag/safe-json-stringify')

module.exports = {
  load: (client) => {
    /* configuration requests from renderers */

    // pre serialise config outside of the sync IPC call so we avoid
    // unnecessary computation while the process is blocked
    const configStr = serializeConfigForRenderer(client._config)

    // this callback returns the main client's configuration to renderer so it can start its own client
    ipcMain.on(CHANNEL_CONFIG, (event, data) => {
      // the renderer blocks until this function returns a value
      event.returnValue = configStr
    })

    /* synchronisation from renderers */

    const bugsnagIpcMain = new BugsnagIpcMain(client)

    // delegate all method calls to the BugsnagIpcMain class's handle method
    ipcMain.handle(CHANNEL_RENDERER_TO_MAIN, bugsnagIpcMain.handle)

    /* synchronisation to renderers */

    // listen to the state sync emitter and propagate changes out to renderers
    const { events, emitter } = client.getPlugin('stateSync')
    events.forEach(eventName => {
      emitter.on(eventName, (payload, source) => propagateEventToRenderers(eventName, payload, source))
    })

    // keep track of the renderers in existence
    const renderers = new Set()
    app.on('web-contents-created', (event, webContents) => {
      // if you send data to a webContents instance before it has emitted this event, it will crash
      webContents.on('did-start-loading', () => {
        client._logger.debug(`Renderer #${webContents.id} created`)
        renderers.add(webContents)
      })
      webContents.on('destroy', () => {
        client._logger.debug(`Renderer #${webContents.id} destroyed`)
        renderers.delete(webContents)
      })
    })

    // converts a stateSync event to an IPC event and sends it to each renderer,
    // unless that render was the source of the change
    const propagateEventToRenderers = (type, payload, source) => {
      client._logger.debug('Propagating change event to renderers')
      const event = jsonStringify({ type, payload })
      for (const renderer of renderers) {
        // source=null when the event was triggered by the main process so all renders should be notified
        if (source === null || renderer.id !== source.id) {
          client._logger.debug(`Sending change event to renderer #${renderer.id}`)
          renderer.send(CHANNEL_MAIN_TO_RENDERER, event)
        } else {
          client._logger.debug(`Skipping renderer #${renderer.id} because it is the source of the event`)
        }
      }
    }

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
