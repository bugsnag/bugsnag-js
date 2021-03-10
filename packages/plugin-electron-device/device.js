const cuid = require('@bugsnag/cuid')

const platformToOs = new Map([
  ['darwin', 'macOS'],
  ['linux', 'Linux'],
  ['win32', 'Windows']
])

// electron memory APIs are documented as KB but are actually KiB
const kibibytesToBytes = kibibytes => kibibytes * 1024

const createDeviceUpdater = (client, device) => newProperties => {
  Object.assign(device, newProperties)
  client.addMetadata('device', device)
}

module.exports = (app, screen, process, filestore) => ({
  load (client) {
    const device = {}
    const updateDevice = createDeviceUpdater(client, device)

    const primaryDisplay = screen.getPrimaryDisplay()

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

    // fetch the device ID from the filestore or generate a new one if it does
    // not exist yet
    filestore.getDeviceInfo()
      .then(cachedDevice => {
        if (cachedDevice.id) {
          updateDevice({ id: cachedDevice.id })
          return
        }

        const id = cuid()

        filestore.setDeviceInfo({ id })
          .then(() => { updateDevice({ id: id }) })
          .catch(err => { client._logger.error(err) })
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
