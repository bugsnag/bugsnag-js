import { Config, Plugin } from '@bugsnag/core'
import isError from '@bugsnag/core/lib/iserror'
import fixBluebirdStacktrace from './fix-bluebird-stacktrace'

type Listener = (evt: PromiseRejectionEvent) => void

let _listener: Listener | null

interface BluebirdPromiseRejectionEvent {
  detail?: {
    reason: PromiseRejectionEvent['reason']
    promise: PromiseRejectionEvent['promise']
  }
}

/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */
export default (win = window): Plugin => {
  const plugin: Plugin = {
    load: (client) => {
      const config = client._config as Required<Config>

      if (!config.autoDetectErrors || !config.enabledErrorTypes.unhandledRejections) return
      const listener: Listener = (ev) => {
        const bluebirdEvent = ev as BluebirdPromiseRejectionEvent

        let error = ev.reason
        let isBluebird = false

        // accessing properties on evt.detail can throw errors (see #394)
        try {
          if (bluebirdEvent.detail && bluebirdEvent.detail.reason) {
            error = bluebirdEvent.detail.reason
            isBluebird = true
          }
        } catch (e) {}

        const event = client.Event.create(error, false, {
          severity: 'error',
          // Report unhandled promise rejections as handled when set by config
          unhandled: !config.reportUnhandledPromiseRejectionsAsHandled,
          severityReason: { type: 'unhandledPromiseRejection' }
        }, 'unhandledrejection handler', 1, client._logger)

        if (isBluebird) {
          event.errors[0].stacktrace.map(fixBluebirdStacktrace(error))
        }

        client._notify(event, (event) => {
          if (isError(event.originalError) && !event.originalError.stack) {
            event.addMetadata('unhandledRejection handler', {
              [Object.prototype.toString.call(event.originalError)]: {
                name: event.originalError.name,
                message: event.originalError.message,
                // @ts-expect-error optional error.code property
                code: event.originalError.code
              }
            })
          }
        })
      }
      if (typeof win.addEventListener === 'function') {
        win.addEventListener('unhandledrejection', listener)
      }
      _listener = listener
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    plugin.destroy = (win = window) => {
      if (_listener) {
        if (typeof win.removeEventListener === 'function') {
          win.removeEventListener('unhandledrejection', _listener)
        }
      }
      _listener = null
    }
  }

  return plugin
}
