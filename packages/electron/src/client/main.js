const Client = require('@bugsnag/core/client')
const { schema } = require('../config/main')
const internalPlugins = [
  // main internal plugins go here
  require('@bugsnag/plugin-electron-state-sync'),
  require('@bugsnag/plugin-electron-ipc')
]

module.exports = (opts) => {
  const bugsnag = new Client(opts, schema, internalPlugins, require('../id'))
  // bugsnag._setDelivery(electron main)

  // noop session delegate for now
  bugsnag._sessionDelegate = { startSession: () => bugsnag, resumeSession: () => {}, pauseSession: () => {} }

  bugsnag._logger.debug('Loaded! In main process.')

  return bugsnag
}
