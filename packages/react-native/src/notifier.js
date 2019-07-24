const NativeModules = require('react-native').NativeModules
const NativeClient = NativeModules.BugsnagReactNative

const name = 'Bugsnag React Native'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'

const React = require('react')

const Client = require('@bugsnag/core/client')

const delivery = require('@bugsnag/delivery-react-native')
const session = require('@bugsnag/plugin-react-native-session')
const reportSync = require('@bugsnag/plugin-react-native-report-sync')
const clientSync = require('@bugsnag/plugin-react-native-client-sync')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs'),
  require('@bugsnag/plugin-react-native-app-state-breadcrumbs'),
  require('@bugsnag/plugin-react-native-connectivity-breadcrumbs'),
  require('@bugsnag/plugin-react-native-orientation-breadcrumbs')
]

const ALLOWED_JS_OPTS = [
  'logger', 'beforeSend', 'user', 'context', 'metaData'
]

const bugsnagReact = require('@bugsnag/plugin-react')

module.exports = (jsOpts = {}) => {
  const warnings = []

  if (typeof jsOpts === 'object' && jsOpts) {
    const ignoredOpts = Object.keys(jsOpts).filter(k => !ALLOWED_JS_OPTS.includes(k))
    if (ignoredOpts.length) {
      warnings.push(`The following options were supplied in JS but they will not be used:\n\n- ${ignoredOpts.join('\n - ')}\n\nAll options should be supplied in native config except:\n\n- ${ALLOWED_JS_OPTS.join('\n - ')}`)
    }
  }

  const opts = {
    // all config is set up in and provided by the native layer…
    ...NativeClient.configure(),
    // …with a few exceptions
    ...ALLOWED_JS_OPTS.reduce((accum, k) => {
      if (jsOpts && typeof jsOpts === 'object' && typeof jsOpts[k] !== 'undefined') {
        accum[k] = jsOpts[k]
      }
      return accum
    }, {})
  }

  const bugsnag = new Client({ name, version, url })

  bugsnag.delivery(client => delivery(client, NativeClient))
  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  if (warnings) warnings.forEach(w => bugsnag._logger.warn(w))

  bugsnag.use(session, NativeClient)
  bugsnag.use(reportSync, NativeClient)
  bugsnag.use(clientSync, NativeClient)

  plugins.forEach(pl => bugsnag.use(pl))
  bugsnag.use(bugsnagReact, React)

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag
}

module.exports['default'] = module.exports
