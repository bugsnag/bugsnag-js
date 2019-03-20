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

    client.config.beforeSend.unshift(report => {
      const now = new Date()
      const inForeground = AppState.currentState === 'active'
      report.app.inForeground = inForeground
      report.app.duration = now - appStart
      if (inForeground) {
        report.app.durationInForeground = now - lastEnteredForeground
      }
    })

    if (!client.app.version && Constants.manifest.version) {
      client.app.version = Constants.manifest.version
    }

    if (Constants.platform.android && Constants.platform.android.versionCode) {
      client.app.versionCode = Constants.platform.android.versionCode
    }

    if (Constants.platform.ios && Constants.platform.ios.buildNumber) {
      client.app.bundleVersion = Constants.platform.ios.buildNumber
    }

    if (Constants.manifest.revisionId) {
      client.app.codeBundleId = Constants.manifest.revisionId
    }
  }
}
