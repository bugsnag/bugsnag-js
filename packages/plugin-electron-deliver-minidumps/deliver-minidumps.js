const { writeFile, access } = require('fs').promises
const { F_OK } = require('fs').constants
const { crashReporter } = require('electron')
const MinidumpDeliveryLoop = require('./minidump-loop')
const MinidumpQueue = require('./minidump-queue')
const sendMinidumpFactory = require('./send-minidump')
const NetworkStatus = require('@bugsnag/electron-network-status')

const isEnabledFor = client => client._config.autoDetectErrors && client._config.enabledErrorTypes.nativeCrashes

// global indicator for whether network requests can be sent yet
let isNetworkReady = false

module.exports = (app, net, filestore, NativeClient) => ({
  name: 'deliverMinidumps',
  load: (client) => {
    if (!isEnabledFor(client)) {
      return
    }

    // the minidumps endpoint can only be missing for on-premise users who
    // haven't configured it as it's not required by the config validation
    if (typeof client._config.endpoints.minidumps !== 'string') {
      client._logger.warn(
        `Invalid configuration. endpoint.minidumps should be a valid URL, got ${typeof client._config.endpoints.minidumps}. Bugsnag will not send minidumps.`
      )

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

    const { sendMinidump } = sendMinidumpFactory(net, client)
    const queue = new MinidumpQueue(filestore)
    const loop = new MinidumpDeliveryLoop(sendMinidump, client._config.onSend, queue, client._logger)

    app.whenReady().then(() => {
      const stateManagerPlugin = client.getPlugin('clientStateManager')
      const statusUpdater = new NetworkStatus(stateManagerPlugin, net, app)
      loop.watchNetworkStatus(statusUpdater)
      statusUpdater.watch(online => { isNetworkReady = online })
    })

    const handler = createChildProcessCrashHandler(client, filestore, queue, loop)
    if (process.versions.electron < '12.0.0') {
      // superseded by render-process-gone
      app.on('renderer-process-crashed', handler)
      // both are superseded by child-process-gone
      app.on('child-process-crashed', handler)
      app.on('gpu-process-crashed', handler)
    } else {
      app.on('render-process-gone', handler)
      app.on('child-process-gone', handler)
    }
  }
})

const createChildProcessCrashHandler = (client, filestore, queue, loop) => () => {
  const info = takeEventSnapshot(client)
  if (client._session) {
    client._session._track({ _handledState: { unhandled: true } })
    info.session = client._session.toJSON()
  }

  findNewMinidump(filestore, queue)
    .then(async minidumpPath => {
      const eventPath = filestore.getBackgroundEventInfoPath(minidumpPath)
      await writeFile(eventPath, JSON.stringify(info))
      queue.push({ minidumpPath, eventPath })
      // if not ready, will be sent automatically when app finishes launching
      // or comes online
      if (isNetworkReady) {
        loop.start()
      }
    })
    .catch(e => client._logger.error('Failed to enqueue minidump', e))
}

const takeEventSnapshot = (client) => ({
  app: { ...client._app },
  breadcrumbs: client._breadcrumbs.slice(),
  context: client._context,
  device: { ...client._device },
  metadata: { ...client._metadata },
  severity: 'error',
  severityReason: { type: 'unhandledException' },
  unhandled: true,
  user: { ...client._user }
})

const findNewMinidump = async (filestore, queue) => {
  const paths = await filestore._listMinidumpFiles()
  for (const path of paths) {
    // Check if the minidump has been processed already
    if (queue.hasSeen(path)) {
      continue
    }

    // Ignore this minidump if it already has event path data
    if (await fileExists(filestore.getBackgroundEventInfoPath(path))) {
      continue
    }

    return path
  }
  throw new Error('No new minidump found')
}

const fileExists = async (filepath) => {
  try {
    await access(filepath, F_OK)
    return true
  } catch (e) {
    return false
  }
}
