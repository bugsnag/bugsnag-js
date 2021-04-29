const electron = require('electron')

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Breadcrumb = require('@bugsnag/core/breadcrumb')
const Session = require('@bugsnag/core/session')

const makeDelivery = require('@bugsnag/delivery-electron')
const { FileStore } = require('@bugsnag/electron-filestore')
const { schema } = require('../config/main')

Event.__type = 'electronnodejs'

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

  // main internal plugins go here
  const internalPlugins = [
    // THIS PLUGIN MUST BE FIRST!
    require('@bugsnag/plugin-internal-callback-marker').FirstPlugin,
    require('@bugsnag/plugin-electron-client-state-manager'),
    require('@bugsnag/plugin-electron-ipc'),
    require('@bugsnag/plugin-node-uncaught-exception'),
    require('@bugsnag/plugin-node-unhandled-rejection'),
    require('@bugsnag/plugin-electron-app')(NativeClient, process, electron.app, electron.BrowserWindow),
    require('@bugsnag/plugin-electron-app-breadcrumbs')(electron.app, electron.BrowserWindow),
    require('@bugsnag/plugin-electron-device')(electron.app, electron.screen, process, filestore, NativeClient, electron.powerMonitor),
    require('@bugsnag/plugin-electron-session')(electron.app, electron.BrowserWindow, filestore),
    require('@bugsnag/plugin-console-breadcrumbs'),
    require('@bugsnag/plugin-strip-project-root'),
    require('@bugsnag/plugin-electron-preload-error')(electron.app),
    require('@bugsnag/plugin-electron-net-breadcrumbs')(electron.net),
    // THIS PLUGIN MUST BE LAST!
    require('@bugsnag/plugin-internal-callback-marker').LastPlugin
  ]

  const bugsnag = new Client(opts, schema, internalPlugins, require('../id'))

  bugsnag._setDelivery(makeDelivery(filestore, electron.net, electron.app))

  bugsnag._logger.debug('Loaded! In main process.')

  return bugsnag
}

module.exports.Client = Client
module.exports.Event = Event
module.exports.Session = Session
module.exports.Breadcrumb = Breadcrumb
