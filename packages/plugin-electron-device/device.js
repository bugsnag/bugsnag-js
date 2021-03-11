const platformToOs = new Map([
  ['darwin', 'macOS'],
  ['linux', 'Linux'],
  ['win32', 'Windows']
])

// electron memory APIs are documented as KB but are actually KiB
const kibibytesToBytes = kibibytes => kibibytes * 1024

const createDeviceUpdater = (client, NativeClient, device) => newProperties => {
  Object.assign(device, newProperties)

  try {
    NativeClient.setDevice(device)
  } catch (err) {
    client._logger.error(err)
  }
}

module.exports = (app, screen, process, filestore, NativeClient) => ({
  load (client) {
    const device = {}
    const updateDevice = createDeviceUpdater(client, NativeClient, device)

    const primaryDisplay = screen.getPrimaryDisplay() || {}

    updateDevice({
      totalMemory: kibibytesToBytes(process.getSystemMemoryInfo().total),
      locale: app.getLocale(),
      osName: platformToOs.get(process.platform) || process.platform,
      osVersion: process.getSystemVersion(),
      runtimeVersions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
      },
      screenResolution: primaryDisplay.size,
      screenDensity: primaryDisplay.scaleFactor
    })

    // fetch the device ID from the filestore - if one does not exist it will be
    // created for us
    filestore.getDeviceInfo()
      .then(cachedDevice => {
        // if _everything_ goes wrong this may be missing
        if (cachedDevice.id) {
          updateDevice({ id: cachedDevice.id })
        }
      })
      .catch(err => { client._logger.error(err) })

    screen.on('display-metrics-changed', (event, display, changedMetrics) => {
      // ignore updates to non-primary screens
      if (display.id !== primaryDisplay.id) {
        return
      }

      // ignore updates that don't affect the size or scale factor
      if (!changedMetrics.includes('bounds') && !changedMetrics.includes('scaleFactor')) {
        return
      }

      updateDevice({
        screenResolution: display.size,
        screenDensity: display.scaleFactor
      })
    })

    // device properties that can only be added when an event/session is created
    const justInTimeDeviceData = () => ({
      freeMemory: kibibytesToBytes(process.getSystemMemoryInfo().free),
      time: new Date()
    })

    const callback = eventOrSession => {
      eventOrSession.device = Object.assign(
        {},
        eventOrSession.device,
        device,
        justInTimeDeviceData()
      )
    }

    client.addOnError(callback, true)
    client.addOnSession(callback)
  }
})
