const electron = require('electron')
const Client = require('@bugsnag/core/client')
const makeDelivery = require('@bugsnag/delivery-electron')
const { FileStore } = require('@bugsnag/electron-filestore')
const { schema } = require('../config/main')

// noop native client for now
const NativeClient = {
  setApp () {},
  setDevice () {}
}

module.exports = (opts) => {
  const filestore = new FileStore(
    opts.apiKey,
    electron.app.getPath('userCache'),
    electron.app.getPath('crashDumps')
  )

  const internalPlugins = [
    // main internal plugins go here
    require('@bugsnag/plugin-electron-state-sync'),
    require('@bugsnag/plugin-electron-ipc'),
    require('@bugsnag/plugin-node-uncaught-exception'),
    require('@bugsnag/plugin-node-unhandled-rejection'),
    require('@bugsnag/plugin-electron-app')(NativeClient, process, electron.app, electron.BrowserWindow),
    require('@bugsnag/plugin-electron-app-breadcrumbs')(electron.app, electron.BrowserWindow),
    require('@bugsnag/plugin-electron-device')(electron.app, electron.screen, process, filestore, NativeClient, electron.powerMonitor)
  ]

  const bugsnag = new Client(opts, schema, internalPlugins, require('../id'))

  bugsnag._setDelivery(makeDelivery(filestore, electron.net))

  // noop session delegate for now
  bugsnag._sessionDelegate = { startSession: () => bugsnag, resumeSession: () => {}, pauseSession: () => {} }

  bugsnag._logger.debug('Loaded! In main process.')

  return bugsnag
}
