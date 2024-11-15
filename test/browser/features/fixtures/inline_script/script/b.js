window.onload = function () {
  var bugsnagScript = document.createElement('SCRIPT')
  bugsnagScript.src = '/docs/node_modules/@bugsnag/browser/dist/bugsnag.min.js'
  document.documentElement.appendChild(bugsnagScript)

  if (!document.attachEvent) {
    bugsnagScript.onload = onScriptLoad
  } else {
    // onload doesn't fire in old IE
    if (/^loaded|complete$/.test(bugsnagScript.readyState)) {
      onScriptLoad()
    } else {
      bugsnagScript.onreadystatechange = function () {
        if (/^loaded|complete$/.test(bugsnagScript.readyState)) onScriptLoad()
      }
    }
  }

  function onScriptLoad () {
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