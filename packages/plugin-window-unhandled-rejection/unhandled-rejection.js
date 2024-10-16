const map = require('@bugsnag/core/lib/es-utils/map')
const isError = require('@bugsnag/core/lib/iserror')

let _listener
/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */
module.exports = (win = window) => {
  const plugin = {
    load: (client) => {
      if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return
      const listener = evt => {
        let error = evt.reason
        let isBluebird = false

        // accessing properties on evt.detail can throw errors (see #394)
        try {
          if (evt.detail && evt.detail.reason) {
            error = evt.detail.reason
            isBluebird = true
          }
        } catch (e) {}

        // Report unhandled promise rejections as handled if the user has configured it
        const unhandled = !client._config.reportUnhandledPromiseRejectionsAsHandled

        const event = client.Event.create(error, false, {
          severity: 'error',
          unhandled,
          severityReason: { type: 'unhandledPromiseRejection' }
        }, 'unhandledrejection handler', 1, client._logger)

        if (isBluebird) {
          map(event.errors[0].stacktrace, fixBluebirdStacktrace(error))
        }

        client._notify(event, (event) => {
          if (isError(event.originalError) && !event.originalError.stack) {
            event.addMetadata('unhandledRejection handler', {
              [Object.prototype.toString.call(event.originalError)]: {
                name: event.originalError.name,
                message: event.originalError.message,
                code: event.originalError.code
              }
            })
          }
        })
      }
      if ('addEventListener' in win) {
        win.addEventListener('unhandledrejection', listener)
      } else {
        win.onunhandledrejection = (reason, promise) => {
          listener({ detail: { reason, promise } })
        }
      }
      _listener = listener
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    plugin.destroy = (win = window) => {
      if (_listener) {
        if ('addEventListener' in win) {
          win.removeEventListener('unhandledrejection', _listener)
        } else {
          win.onunhandledrejection = null
        }
      }
      _listener = null
    }
  }

  return plugin
}

// The stack parser on bluebird stacks in FF get a suprious first frame:
//
// Error: derp
//   b@http://localhost:5000/bluebird.html:22:24
//   a@http://localhost:5000/bluebird.html:18:9
//   @http://localhost:5000/bluebird.html:14:9
//
// results in
//   […]
//     0: Object { file: "Error: derp", method: undefined, lineNumber: undefined, … }
//     1: Object { file: "http://localhost:5000/bluebird.html", method: "b", lineNumber: 22, … }
//     2: Object { file: "http://localhost:5000/bluebird.html", method: "a", lineNumber: 18, … }
//     3: Object { file: "http://localhost:5000/bluebird.html", lineNumber: 14, columnNumber: 9, … }
//
// so the following reduce/accumulator function removes such frames
//
// Bluebird pads method names with spaces so trim that too…
// https://github.com/petkaantonov/bluebird/blob/b7f21399816d02f979fe434585334ce901dcaf44/src/debuggability.js#L568-L571
const fixBluebirdStacktrace = (error) => (frame) => {
  if (frame.file === error.toString()) return
  if (frame.method) {
    frame.method = frame.method.replace(/^\s+/, '')
  }
}
