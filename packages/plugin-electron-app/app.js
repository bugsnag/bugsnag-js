const osToAppType = new Map([
  ['darwin', 'macOS'],
  ['linux', 'Linux'],
  ['win32', 'Windows']
])

const createAppUpdater = (client, NativeClient, app) => newProperties => {
  Object.assign(app, newProperties)

  try {
    NativeClient.setApp(app)
  } catch (err) {
    client._logger.error(err)
  }
}

const getInstalledFromStore = process => {
  if (process.mas) {
    return 'mac'
  }

  if (process.windowsStore) {
    return 'windows'
  }

  return undefined
}

module.exports = (NativeClient, process, electronApp, BrowserWindow) => ({
  name: 'electronApp',
  load (client) {
    const app = {}
    const updateApp = createAppUpdater(client, NativeClient, app)

    const markLaunchComplete = () => {
      if (app.isLaunching) {
        updateApp({ isLaunching: false })
      }
    }

    // mark the launch complete after the configured time
    if (client._config.launchDurationMillis > 0) {
      setTimeout(markLaunchComplete, client._config.launchDurationMillis)
    }

    // 'getCreationTime' can return null so fallback to the current time
    // the creation time can include microseconds (depending on the platform)
    // so we round it to the nearest millisecond
    const appStart = Math.round(process.getCreationTime() || Date.now())
    let lastEnteredForeground = appStart

    updateApp({
      inForeground: BrowserWindow.getFocusedWindow() !== null,
      isLaunching: true,
      releaseStage: electronApp.isPackaged ? 'production' : 'development',
      type: osToAppType.get(process.platform),
      version: electronApp.getVersion(),
      // TODO: get the full bundle version on macOS and windows, getVersion() on linux
      versionCode: electronApp.getVersion()
    })

    client.addMetadata('app', {
      installedFromStore: getInstalledFromStore(process),
      name: electronApp.getName()
    })

    electronApp.on('browser-window-focus', () => {
      if (app.inForeground === false) {
        lastEnteredForeground = Date.now()
      }

      updateApp({ inForeground: true })
    })

    electronApp.on('browser-window-blur', () => {
      updateApp({ inForeground: BrowserWindow.getFocusedWindow() !== null })
    })

    // the blur event doesn't fire for the last window to close so we have to
    // use the window-all-closed event instead
    electronApp.on('window-all-closed', () => {
      updateApp({ inForeground: false })

      // if there are no other listeners for 'window-all-closed' electron will
      // quit the app so we replicate that behaviour here
      // this is '2' because we add a listener and electron adds a listener:
      // https://github.com/electron/electron/blob/5b205731f6ff77372656f0c85c52b703ec523e6f/lib/browser/init.ts#L168-L173
      if (electronApp.listenerCount('window-all-closed') === 2) {
        electronApp.quit()
      }
    })

    client.addOnError(event => {
      const now = Date.now()

      event.app = Object.assign(
        {},
        event.app,
        app,
        {
          duration: now - appStart,
          durationInForeground: app.inForeground ? now - lastEnteredForeground : undefined
        }
      )
    }, true)

    client.addOnSession(session => {
      session.app = Object.assign(
        {},
        session.app,
        app,
        // these values don't go in sessions
        { inForeground: undefined, isLaunching: undefined }
      )
    })

    return { markLaunchComplete }
  },
  configSchema: {
    launchDurationMillis: {
      defaultValue: () => 5000,
      message: 'should be a number ≥0',
      validate: value => value >= 0
    }
  }
})
