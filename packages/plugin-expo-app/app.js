const { Constants } = require('expo')
const { AppState } = require('react-native')

const appStart = new Date()

module.exports = {
  init: client => {
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

    client.config.beforeSend.unshift(report => {
      const now = new Date()
      const inForeground = AppState.currentState === 'active'
      report.set('app', {
        inForeground: inForeground,
        duration: now - appStart,
        nativeBundleVersion,
        nativeVersionCode
      })
      if (inForeground) {
        report.set('app', 'durationInForeground', now - lastEnteredForeground)
      }
    })

    if (!client.get('app', 'version') && Constants.manifest.version) {
      client.set('app', 'version', Constants.manifest.version)
    }

    if (Constants.manifest.revisionId) {
      client.set('app', 'codeBundleId', Constants.manifest.revisionId)
    }
  }
}
