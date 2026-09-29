// www.bugsnag.com
// https://github.com/bugsnag/bugsnag-js/tree/main/examples/js/browserlite
//
// this example demonstrates @bugsnag/browserlite: a minimal browser notifier
// bundle that only captures errors/rejections by default, and lets you add
// extra plugins (breadcrumbs, sessions, device metadata, ...) on demand via
// the `plugins` config option.
// ***********************************************************

var Bugsnag = require('@bugsnag/browserlite')
var pluginBrowserSession = require('@bugsnag/plugin-browser-session')
var pluginNetworkBreadcrumbs = require('@bugsnag/plugin-network-breadcrumbs')

// the "lite" client: only window.onerror + unhandled rejection capture are
// bundled, so this stays as small as possible.
Bugsnag.start({
  apiKey: '<YOUR_API_KEY>',
  releaseStage: 'development',
  onError: function (event) {
    event.addMetadata('demo', { plugins: 'none (lite defaults only)' })
  }
})

document.getElementById('liteHandled').addEventListener('click', function () {
  try {
    // deliberate ReferenceError
    console.log(doesntExist) // eslint-disable-line
  } catch (e) {
    console.log('a handled error has been reported using the lite client')
    Bugsnag.notify(e)
  }
})

document.getElementById('liteUnhandled').addEventListener('click', function () {
  console.log('an unhandled error has been reported using the lite client')
  var num = 1
  // deliberate TypeError, caught by the bundled window.onerror plugin
  num.toUpperCase()
})

// a second, independent client demonstrating opt-in plugins. Session
// tracking and network breadcrumbs are *not* bundled by default in
// @bugsnag/browserlite, so we add them explicitly here.
var pluginClient = Bugsnag.createClient({
  apiKey: '<YOUR_API_KEY>',
  releaseStage: 'development',
  autoTrackSessions: true, // required for plugin-browser-session
  plugins: [pluginBrowserSession, pluginNetworkBreadcrumbs()],
  onError: function (event) {
    event.addMetadata('demo', { plugins: 'plugin-browser-session, plugin-network-breadcrumbs' })
  }
})

document.getElementById('pluginHandled').addEventListener('click', function () {
  console.log('a handled error with breadcrumbs/session data has been reported')
  pluginClient.notify(new Error('Reported with opt-in plugins enabled'))
})
