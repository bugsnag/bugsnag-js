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
      report.app.inForeground = inForeground
      report.app.duration = now - appStart
      if (inForeground) {
        report.app.durationInForeground = now - lastEnteredForeground
      }
      report.updateMetaData('app', { nativeBundleVersion, nativeVersionCode })
    })

    if (!client.app.version && Constants.manifest.version) {
      client.app.version = Constants.manifest.version
    }

    if (Constants.manifest.revisionId) {
      client.app.codeBundleId = Constants.manifest.revisionId
    }
  }
}
