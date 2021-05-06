const native = require('bindings')('bugsnag_plugin_electron_app_bindings')
const { schema } = require('@bugsnag/core/config')

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

module.exports = (NativeClient, process, electronApp, BrowserWindow, NativeApp = native) => ({
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
      releaseStage: client._config.releaseStage,
      type: client._config.appType || osToAppType.get(process.platform),
      version: client._config.appVersion
    })

    client.addMetadata('app', {
      installedFromStore: getInstalledFromStore(process),
      name: electronApp.getName()
    })

    electronApp.on('browser-window-focus', () => {
      if (app.inForeground === false) {
        lastEnteredForeground = Date.now()

        updateApp({ inForeground: true })
      }
    })

    electronApp.on('browser-window-blur', () => {
      // switching focus between windows will result in both a blur & focus event
      // but the focused window will always be set when this happens
      if (BrowserWindow.getFocusedWindow() === null) {
        updateApp({ inForeground: false })
      }
    })

    // keep track of the number of windows that exist so we can mark the app as
    // in the background when there are no windows left
    const allWindows = BrowserWindow.getAllWindows()
    let numberOfWindows = allWindows.length

    const onBrowserWindowClosed = () => {
      --numberOfWindows

      if (numberOfWindows === 0) {
        updateApp({ inForeground: false })
      }
    }

    allWindows.forEach(window => { window.on('closed', onBrowserWindowClosed) })

    electronApp.on('browser-window-created', (_event, newWindow) => {
      // the focus event will fire for the new window so we don't need to update
      // inForeground here
      ++numberOfWindows

      newWindow.on('closed', onBrowserWindowClosed)
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

    client._app = app

    return { markLaunchComplete }
  },
  configSchema: {
    appVersion: {
      ...schema.appVersion,
      defaultValue: () => NativeApp.getPackageVersion() || electronApp.getVersion() || undefined
    },
    launchDurationMillis: {
      defaultValue: () => 5000,
      message: 'should be a number ≥0',
      validate: value => value >= 0
    }
  }
})
