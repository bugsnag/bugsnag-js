const sessionDelegate = require('@bugsnag/plugin-browser-session')
const { Session } = require('@bugsnag/core')

const SESSION_TIMEOUT_MS = 60 * 1000

const isNativeClientEnabled = client => client._config.autoDetectErrors && client._config.enabledErrorTypes.nativeCrashes

module.exports = (app, BrowserWindow, NativeClient) => ({
  load (client) {
    // load the actual session delegate from plugin-browser-session
    sessionDelegate.load(client)

    if (isNativeClientEnabled(client)) {
    // Ensure native session kept in sync with session changes
      const oldTrack = Session.prototype._track
      Session.prototype._track = function (...args) {
        const result = oldTrack.apply(this, args)
        NativeClient.setSession(serializeForNativeEvent(this))
        return result
      }

      // Override the delegate to perform electron-specific synchronization
      const defaultDelegate = client._sessionDelegate
      client._sessionDelegate = {
        startSession: (client, session) => {
          const result = defaultDelegate.startSession(client, session)
          NativeClient.setSession(serializeForNativeEvent(client._session))
          return result
        },
        resumeSession: (client) => {
          const result = defaultDelegate.resumeSession(client)
          NativeClient.setSession(serializeForNativeEvent(client._session))
          return result
        },
        pauseSession: (client) => {
          const result = defaultDelegate.pauseSession(client)
          NativeClient.setSession(serializeForNativeEvent(client._session))
          return result
        }
      }
    }

    if (!client._config.autoTrackSessions) {
      return
    }
    // ensure the session gets started _after_ we have a device id
    app.whenReady()
      .then(() => client.startSession())
      .catch(() => {})

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

const serializeForNativeEvent = session => {
  if (session) {
    const nativeSession = session.toJSON()
    // increment to account for future native crash
    nativeSession.events.unhandled += 1
    return nativeSession
  }
  return null
}
