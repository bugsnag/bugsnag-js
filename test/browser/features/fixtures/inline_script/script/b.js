window.onload = function () {
  var bugsnagScript = document.createElement('SCRIPT')
  bugsnagScript.src = '/node_modules/@bugsnag/browser/dist/bugsnag.min.js'
  document.body.appendChild(bugsnagScript)
  bugsnagScript.onload = function () {
    Bugsnag.start({
      apiKey: API_KEY,
      endpoints: { notify: NOTIFY, sessions: SESSIONS }
    })
    Bugsnag.addOnError(function (event) {
      // simulate an error with no stackframes
      event.errors[0].stacktrace = []
    }, true) // <-- `true` means the callback will run before the inline-script-content plugin
    Bugsnag.notify(new Error('async hi'))
  }
}