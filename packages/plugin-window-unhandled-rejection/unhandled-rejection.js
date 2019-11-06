const hasStack = require('@bugsnag/core/lib/has-stack')
const { reduce } = require('@bugsnag/core/lib/es-utils')
const isError = require('@bugsnag/core/lib/iserror')
const Event = require('@bugsnag/core/event')

/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */
let _listener
exports.init = (client, win = window) => {
  if (client._config.autoDetectErrors === false || client._config.autoDetectUnhandledRejections === false) return

  const listener = event => {
    let error = event.reason
    let isBluebird = false

    // accessing properties on event.detail can throw errors (see #394)
    try {
      if (event.detail && event.detail.reason) {
        error = event.detail.reason
        isBluebird = true
      }
    } catch (e) {}

    const handledState = {
      severity: 'error',
      unhandled: true,
      severityReason: { type: 'unhandledPromiseRejection' }
    }

    if (error && hasStack(error)) {
      // if it quacks like an Error…
      let stacktrace = Event.getStacktrace(error)
      if (isBluebird) {
        stacktrace = reduce(stacktrace, fixBluebirdStacktrace(error), [])
      }
      client._notify(new Event(error.name, error.message, stacktrace, error, handledState))
    } else {
      // if it doesn't…
      const msg = 'Rejection reason was not an Error. See "Promise" tab for more detail.'
      client._notify(new Event(
        error && error.name ? error.name : 'UnhandledRejection',
        error && error.message ? error.message : msg,
        [],
        error,
        handledState
      ), (event) => {
        // stuff the rejection reason into metaData, it could be useful
        event.addMetadata('promise', 'rejection reason', serializableReason(error))
      })
    }
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

exports.schema = {
  autoDetectUnhandledRejections: {
    defaultValue: () => undefined,
    message: 'should be true|false',
    validate: (value) => value === true || value === false || value === undefined
  }
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = (win = window) => {
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

const serializableReason = (err) => {
  if (err === null || err === undefined) {
    return 'undefined (or null)'
  } else if (isError(err)) {
    return {
      [Object.prototype.toString.call(err)]: {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
      }
    }
  } else {
    return err
  }
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
const fixBluebirdStacktrace = (error) => (accum, frame) => {
  if (frame.file === error.toString()) return accum
  if (frame.method) {
    frame.method = frame.method.replace(/^\s+/, '')
  }
  return accum.concat(frame)
}
