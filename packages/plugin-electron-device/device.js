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

module.exports = (app, screen, process, filestore, NativeClient, powerMonitor) => ({
  load (client) {
    const device = {}
    let cachedDevice = {}

    try {
      // fetch the device ID from the filestore - if one does not exist it will be created for us
      cachedDevice = filestore.getDeviceInfo()
    } catch (e) {
      // swallow errors
      client._logger.error(e)
    }

    const updateDevice = createDeviceUpdater(client, NativeClient, device)

    updateDevice({
      ...cachedDevice,
      totalMemory: kibibytesToBytes(process.getSystemMemoryInfo().total),
      locale: app.getLocale(),
      osName: platformToOs.get(process.platform) || process.platform,
      osVersion: process.getSystemVersion(),
      runtimeVersions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
      }
    })

    client.addMetadata('device', {
      // the value for 'idleThreshold' doesn't matter here because it is ignored
      // if the system is locked and that's the only state we care about
      isLocked: powerMonitor.getSystemIdleState(1) === 'locked',
      // note: this is only available from Electron 12, earlier versions cannot
      // read the battery state without 'on-ac'/'on-battery' events
      usingBattery: powerMonitor.onBatteryPower
    })

    app.whenReady().then(() => {
      // on windows, app.getLocale won't return the locale until the app is ready
      const locale = app.getLocale()

      if (device.locale !== locale) {
        updateDevice({ locale })
      }

      // the screen module can't be used until the app is ready
      const primaryDisplay = screen.getPrimaryDisplay() || {}

      client.addMetadata('device', {
        screenResolution: primaryDisplay.size,
        screenDensity: primaryDisplay.scaleFactor
      })

      screen.on('display-metrics-changed', (event, display, changedMetrics) => {
        // ignore updates to non-primary screens
        if (display.id !== primaryDisplay.id) {
          return
        }

        // ignore updates that don't affect the size or scale factor
        if (!changedMetrics.includes('bounds') && !changedMetrics.includes('scaleFactor')) {
          return
        }

        client.addMetadata('device', {
          screenResolution: display.size,
          screenDensity: display.scaleFactor
        })
      })
    })

    powerMonitor.on('on-ac', () => {
      client.addMetadata('device', { usingBattery: false })
    })

    powerMonitor.on('on-battery', () => {
      client.addMetadata('device', { usingBattery: true })
    })

    powerMonitor.on('unlock-screen', () => {
      client.addMetadata('device', { isLocked: false })
    })

    powerMonitor.on('lock-screen', () => {
      client.addMetadata('device', { isLocked: true })
    })

    client.addOnError(event => {
      event.device = Object.assign(
        {},
        event.device,
        device,
        {
          freeMemory: kibibytesToBytes(process.getSystemMemoryInfo().free),
          time: new Date()
        }
      )

      event.addMetadata('device', { idleTime: powerMonitor.getSystemIdleTime() })

      setDefaultUserId(event)
    }, true)

    client.addOnSession(session => {
      session.device = Object.assign(
        {},
        session.device,
        device
      )
      setDefaultUserId(session)
    })

    const setDefaultUserId = (eventOrSession) => {
      // device id is also used to populate the user id field, if it's not already set
      const user = eventOrSession.getUser()
      if (!user || !user.id) {
        eventOrSession.setUser(eventOrSession.device.id)
      }
    }

    client._device = device
  }
})
