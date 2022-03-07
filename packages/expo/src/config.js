/* global __DEV__ */

const { schema } = require('@bugsnag/core/config')
const Constants = require('expo-constants').default

// If the developer property is not present in the manifest, it means the app is
// not connected to a development tool and is either a published app running in
// the Expo client, or a standalone app
let IS_PRODUCTION = true

if (Constants.manifest) {
  IS_PRODUCTION = !Constants.manifest.developer
} else if (Constants.manifest2) {
  IS_PRODUCTION = !Constants.manifest2?.extra?.expoGo?.developer
}

// The app can still run in production "mode" in development environments, in which
// cases the global boolean __DEV__ will be set to true
const IS_PRODUCTION_MODE = typeof __DEV__ === 'undefined' || __DEV__ !== true

module.exports = {
  logger: {
    ...schema.logger,
    defaultValue: () => getPrefixedConsole()
  },
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => {
      if (IS_PRODUCTION) return 'production'
      if (IS_PRODUCTION_MODE) return 'local-prod'
      return 'local-dev'
    }
  }
}

const getPrefixedConsole = () => {
  return ['debug', 'info', 'warn', 'error'].reduce((accum, method) => {
    // console.error causes standalone expo apps to reload on android
    // so don't do any logging that level – use console.warn instead
    const consoleMethod = (IS_PRODUCTION && method === 'error') ? console.warn : console[method]
    accum[method] = consoleMethod.bind(console, '[bugsnag]')
    return accum
  }, {})
}
