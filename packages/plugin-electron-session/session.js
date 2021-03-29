const sessionDelegate = require('@bugsnag/plugin-browser-session')

const SESSION_TIMEOUT_MS = 60 * 1000

module.exports = (app, BrowserWindow) => ({
  load (client) {
    // load the actual session delegate from plugin-browser-session
    sessionDelegate.load(client)

    if (!client._config.autoTrackSessions) {
      return
    }

    app.whenReady().then(() => { client.startSession() })

    let lastInBackground = null

    app.on('browser-window-focus', () => {
      const now = Date.now()

      // start a session when returning to the foreground after at least 60 seconds
      if (lastInBackground && now - lastInBackground >= SESSION_TIMEOUT_MS) {
        client.startSession()
      }

      lastInBackground = null
    })

    app.on('browser-window-blur', () => {
      const inBackground = BrowserWindow.getFocusedWindow() === null

      if (inBackground) {
        lastInBackground = Date.now()
      }
    })
  }
})
