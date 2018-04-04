const ErrorStackParser = require('error-stack-parser')
const hasStack = require('../../base/lib/has-stack')
const { reduce } = require('../../base/lib/es-utils')
const isError = require('iserror')

/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */
let _listener
exports.init = (client) => {
  const listener = event => {
    let error = event.reason
    let isBluebird = false

    if (event.detail && event.detail.reason) {
      error = event.detail.reason
      isBluebird = true
    }

    const handledState = {
      severity: 'error',
      unhandled: true,
      severityReason: { type: 'unhandledPromiseRejection' }
    }

    let report
    if (error && hasStack(error)) {
      // if it quacks like an Error…
      report = new client.BugsnagReport(error.name, error.message, ErrorStackParser.parse(error), handledState)
      if (isBluebird) {
        report.stacktrace = reduce(report.stacktrace, fixBluebirdStacktrace(error), [])
      }
    } else {
      // if it doesn't…
      const msg = 'Rejection reason was not an Error. See "Promise" tab for more detail.'
      report = new client.BugsnagReport(
        error && error.name ? error.name : 'UnhandledRejection',
        error && error.message ? error.message : msg,
        [],
        handledState
      )
      // stuff the rejection reason into metaData, it could be useful
      report.updateMetaData('promise', 'rejection reason', serializableReason(error))
    }

    client.notify(report)
  }
  if ('addEventListener' in window) {
    window.addEventListener('unhandledrejection', listener)
  } else {
    window.onunhandledrejection = (reason, promise) => {
      listener({ detail: { reason, promise } })
    }
  }
  _listener = listener
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = () => {
    if (_listener) {
      if ('addEventListener' in window) {
        window.removeEventListener('unhandledrejection', _listener)
      } else {
        window.onunhandledrejection = null
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
