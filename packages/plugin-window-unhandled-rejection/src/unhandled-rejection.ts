import { Client, Logger, Plugin, Stackframe } from '@bugsnag/core'
import map from '@bugsnag/core/lib/es-utils/map'
import isError from '@bugsnag/core/lib/iserror'

type Listener = (evt: PromiseRejectionEvent) => void

let _listener: Listener | null

interface InternalClient extends Client {
  _config: {
    autoDetectErrors: boolean
    enabledErrorTypes: {
      unhandledRejections: boolean
    }
    reportUnhandledPromiseRejectionsAsHandled: boolean
  }
  _logger: Logger
}

interface InternalPromiseRejectionEvent {
  detail?: {
    reason: PromiseRejectionEvent['reason']
    promise: PromiseRejectionEvent['promise']
  }
}

type PREvent = PromiseRejectionEvent & InternalPromiseRejectionEvent

type OnUnhandledRejection = (reason: PromiseRejectionEvent['reason'], promise: PromiseRejectionEvent['promise']) => void

declare global {
  interface Window {
    onunhandledrejection: OnUnhandledRejection | null
  }
  interface Error {
    code?: number | string
  }
}

/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */
export default (win = window): Plugin => {
  const plugin: Plugin = {
    load: (client) => {
      const internalClient = client as InternalClient

      if (!internalClient._config.autoDetectErrors || !internalClient._config.enabledErrorTypes.unhandledRejections) return
      const listener: Listener = (evt) => {
        const internalEvent = evt as PREvent

        let error = internalEvent.reason
        let isBluebird = false

        // accessing properties on evt.detail can throw errors (see #394)
        try {
          if (internalEvent.detail && internalEvent.detail.reason) {
            error = internalEvent.detail.reason
            isBluebird = true
          }
        } catch (e) {}

        // Report unhandled promise rejections as handled if the user has configured it
        const unhandled = !internalClient._config.reportUnhandledPromiseRejectionsAsHandled

        const event = internalClient.Event.create(error, false, {
          severity: 'error',
          unhandled,
          severityReason: { type: 'unhandledPromiseRejection' }
        }, 'unhandledrejection handler', 1, internalClient._logger)

        if (isBluebird) {
          map(event.errors[0].stacktrace, fixBluebirdStacktrace(error))
        }

        internalClient._notify(event, (event) => {
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
        (win as Window).onunhandledrejection = (reason, promise) => {
          listener({ detail: { reason, promise } } as unknown as PromiseRejectionEvent)
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
