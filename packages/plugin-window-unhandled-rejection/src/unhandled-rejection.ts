import { Plugin, Stackframe } from '@bugsnag/core'
import map from '@bugsnag/core/lib/es-utils/map'
import isError from '@bugsnag/core/lib/iserror'

type Listener = (evt: PromiseRejectionEvent) => void

let _listener: Listener | null

/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */
export default (win = window): Plugin => {
  const plugin: Plugin = {
    load: (client) => {
      // @ts-expect-error _config is private API
      if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return
      const listener = (evt: PromiseRejectionEvent) => {
        let error = evt.reason
        let isBluebird = false

        // accessing properties on evt.detail can throw errors (see #394)
        try {
          // @ts-expect-error detail does not exist on type PromiseRejectionEvent
          if (evt.detail && evt.detail.reason) {
            // @ts-expect-error detail does not exist on type PromiseRejectionEvent
            error = evt.detail.reason
            isBluebird = true
          }
        } catch (e) {}

        const event = client.Event.create(error, false, {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledPromiseRejection' }
          // @ts-expect-error _logger is private API
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
                // @ts-expect-error Property 'code' does not exist on type 'Error'
                code: event.originalError.code
              }
            })
          }
        })
      }
      if ('addEventListener' in win) {
        win.addEventListener('unhandledrejection', listener)
      } else {
        // @ts-expect-error onunhandledrejection does not exist on type never
        win.onunhandledrejection = (reason, promise) => {
          // @ts-expect-error detail does not exist on type PromiseRejectionEvent
          listener({ detail: { reason, promise } })
        }
      }
      _listener = listener
    }
  }

  // @ts-expect-error cannot find name 'process'
  if (process.env.NODE_ENV !== 'production') {
    plugin.destroy = (win = window) => {
      if (_listener) {
        if ('addEventListener' in win) {
          win.removeEventListener('unhandledrejection', _listener)
        } else {
          (win as Window).onunhandledrejection = null
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
const fixBluebirdStacktrace = (error: PromiseRejectionEvent['reason']) => (frame: Stackframe) => {
  if (frame.file === error.toString()) return
  if (frame.method) {
    frame.method = frame.method.replace(/^\s+/, '')
  }
}
