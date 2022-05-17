const electron = require('electron')

const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Breadcrumb = require('@bugsnag/core/breadcrumb')
const Session = require('@bugsnag/core/session')
const {
  plugin: PluginClientStatePersistence,
  NativeClient
} = require('@bugsnag/plugin-electron-client-state-persistence')

const makeDelivery = require('@bugsnag/delivery-electron')
const { FileStore } = require('@bugsnag/electron-filestore')
const { schema } = require('../config/main')

Event.__type = 'electronnodejs'

module.exports = (opts) => {
  // Sanity check api key has been provided
  if (typeof opts.apiKey !== 'string') {
    throw new Error('No Bugsnag API Key set')
  }

  const filestore = new FileStore(
    opts.apiKey,
    electron.app.getPath('userCache'),
    electron.app.getPath('crashDumps')
  )

  // Normalise the project root upfront so renderers have a fully resolved path
  // The renderers can't do this themselves as they cannot access the 'path' module
  if (opts.projectRoot) {
    const normalizePath = require('@bugsnag/core/lib/path-normalizer')
    opts.projectRoot = normalizePath(opts.projectRoot)
  }

  // main internal plugins go here
  const internalPlugins = [
    // Plugins after the "FirstPlugin" will run in the main process for renderer
    // errors before any renderer onError callbacks are called
    require('@bugsnag/plugin-internal-callback-marker').FirstPlugin,
    require('@bugsnag/plugin-electron-client-state-manager'),
    PluginClientStatePersistence(NativeClient),
    require('@bugsnag/plugin-electron-deliver-minidumps')(electron.app, electron.net, filestore, NativeClient),
    require('@bugsnag/plugin-electron-ipc'),
    require('@bugsnag/plugin-node-uncaught-exception'),
    require('@bugsnag/plugin-node-unhandled-rejection'),
    require('@bugsnag/plugin-electron-app')(NativeClient, process, electron.app, electron.BrowserWindow, filestore),
    require('@bugsnag/plugin-electron-app-breadcrumbs')(electron.app, electron.BrowserWindow),
    require('@bugsnag/plugin-electron-device')(electron.app, electron.screen, process, filestore, NativeClient, electron.powerMonitor),
    require('@bugsnag/plugin-electron-session')(electron.app, electron.BrowserWindow, NativeClient),
    require('@bugsnag/plugin-console-breadcrumbs'),
    require('@bugsnag/plugin-strip-project-root'),
    require('@bugsnag/plugin-electron-process-info')(),
    require('@bugsnag/plugin-electron-preload-error')(electron.app),
    require('@bugsnag/plugin-electron-net-breadcrumbs')(electron.net),
    require('@bugsnag/plugin-stackframe-path-normaliser'),
    // Plugins after the "LastPlugin" will run in the main process for renderer
    // errors after all renderer onError callbacks have been called
    require('@bugsnag/plugin-internal-callback-marker').LastPlugin,
    // The surrounding code plugin must run here because the stacktrace is not
    // present on renderer errors in the first round of callbacks
    require('@bugsnag/plugin-node-surrounding-code')
  ]

  const bugsnag = new Client(opts, schema, internalPlugins, require('../id'))

  filestore.init().catch(err => bugsnag._logger.warn('Failed to init crash FileStore directories', err))

  // expose markLaunchComplete as a method on the Bugsnag client/facade
  const electronApp = bugsnag.getPlugin('electronApp')
  const { markLaunchComplete } = electronApp
  bugsnag.markLaunchComplete = markLaunchComplete
  bugsnag._setDelivery(makeDelivery(filestore, electron.net, electron.app))

  bugsnag._logger.debug('Loaded! In main process.')
  if (bugsnag._isBreadcrumbTypeEnabled('state')) {
    bugsnag.leaveBreadcrumb('Bugsnag loaded', {}, 'state')
  }

  return bugsnag
}

module.exports.Client = Client
module.exports.Event = Event
module.exports.Session = Session
module.exports.Breadcrumb = Breadcrumb
