const Client = require('@bugsnag/core/client')
const { schema, serializeConfigForRenderer } = require('../config/main')
const internalPlugins = [
  // main internal plugins go here
]
const { join } = require('path')
const { ipcMain, app } = require('electron')

module.exports = (opts) => {
  const bugsnag = new Client(opts, schema, internalPlugins, require('../id'))
  // bugsnag._setDelivery(electron main)

  // noop session delegate for now
  bugsnag._sessionDelegate = { startSession: () => bugsnag, resumeSession: () => {}, pauseSession: () => {} }

  bugsnag._logger.debug('Loaded! In main process.')

  setPreload()

  // Implement a receiver of IPC method calls, routing through to the client
  const BugsnagIpcReceiver = {
    configure: () => serializeConfigForRenderer(bugsnag._config)
    /* etc. */
  }

  // Listen for IPC calls and pass them to the receiver
  ipcMain.on('bugsnag::sync', (event, data) => {
    // if (!isValid(data)) return
    event.returnValue = BugsnagIpcReceiver[data.method](...data.args)
  })

  return bugsnag
}

const setPreload = async () => {
  // for every session created, insert Bugsnag's preload script
  app.on('session-created', session => {
    session.setPreloads([join(__dirname, '..', 'preload.js')])
  })
}
