const { crashReporter } = require('electron')
const MinidumpDeliveryLoop = require('./minidump-loop')
const MinidumpQueue = require('./minidump-queue')
const sendMinidumpFactory = require('./send-minidump')
const NetworkStatus = require('@bugsnag/electron-network-status')

const isEnabledFor = client => client._config.autoDetectErrors && client._config.enabledErrorTypes.nativeCrashes

module.exports = (app, net, filestore, NativeClient) => ({
  name: 'deliverMinidumps',
  load: (client) => {
    if (!isEnabledFor(client)) {
      return
    }

    const appRunMetadata = filestore.getAppRunMetadata()

    // make sure that the Electron CrashReporter is configured
    crashReporter.start({
      submitURL: '',
      uploadToServer: false,
      extra: appRunMetadata
    })

    NativeClient.install(
      filestore.getEventInfoPath(appRunMetadata.bugsnag_crash_id),
      filestore.getPaths().lastRunInfo,
      client._config.maxBreadcrumbs
    )

    app.on('ready', () => {
      const stateManagerPlugin = client.getPlugin('clientStateManager')
      const statusUpdater = new NetworkStatus(stateManagerPlugin, net, app)

      const { sendMinidump } = sendMinidumpFactory(net, client)

      const minidumpQueue = new MinidumpQueue(filestore)
      const minidumpLoop = new MinidumpDeliveryLoop(sendMinidump, client._config.onSend, minidumpQueue, client._logger)
      minidumpLoop.watchNetworkStatus(statusUpdater)
    })
  }
})
