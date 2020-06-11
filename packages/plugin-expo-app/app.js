const Constants = require('expo-constants').default
const { AppState } = require('react-native')

const appStart = new Date()

module.exports = {
  load: client => {
    let lastEnteredForeground = appStart
    let lastState = AppState.currentState

    AppState.addEventListener('change', newState => {
      if (newState === 'active' && lastState !== 'active') {
        lastEnteredForeground = new Date()
      }
      lastState = newState
    })

    let nativeBundleVersion, nativeVersionCode
    if (Constants.appOwnership === 'standalone') {
      if (Constants.platform.ios && Constants.platform.ios.buildNumber) {
        nativeBundleVersion = Constants.platform.ios.buildNumber
      }
      if (Constants.platform.android && Constants.platform.android.versionCode) {
        nativeVersionCode = Constants.platform.android.versionCode
      }
    }

    client.addOnSession(session => {
      if (Constants.manifest.revisionId) {
        session.app.codeBundleId = Constants.manifest.revisionId
      }
    })

    client.addOnError(event => {
      const now = new Date()
      const inForeground = AppState.currentState === 'active'

      event.app.inForeground = inForeground
      event.app.duration = now - appStart

      if (inForeground) {
        event.app.durationInForeground = now - lastEnteredForeground
      }

      event.addMetadata('app', { nativeBundleVersion, nativeVersionCode })

      if (Constants.manifest.revisionId) {
        event.app.codeBundleId = Constants.manifest.revisionId
      }
    }, true)
  }
}
