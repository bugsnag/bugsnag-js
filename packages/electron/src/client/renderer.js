const Client = require('@bugsnag/core/client')
const { schema, mergeOptions } = require('../config/renderer')

module.exports = (rendererOpts) => {
  if (!window.__bugsnag_ipc__) throw new Error('Bugsnag was not loaded in the main process')
  const opts = mergeOptions(window.__bugsnag_ipc__.config, rendererOpts)

  const internalPlugins = [
    require('@bugsnag/plugin-electron-renderer-client-sync')(window.__bugsnag_ipc__)
  ]

  const bugsnag = new Client(opts, schema, internalPlugins, require('../id'))
  // bugsnag._setDelivery(electron renderer)
  // noop session delegate for now
  bugsnag._sessionDelegate = { startSession: () => bugsnag, resumeSession: () => {}, pauseSession: () => {} }

  bugsnag._logger.debug('Loaded! In renderer process.')

  return bugsnag
}
