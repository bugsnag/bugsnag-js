const Client = require('@bugsnag/core/client')
const Event = require('@bugsnag/core/event')
const Breadcrumb = require('@bugsnag/core/breadcrumb')
const Session = require('@bugsnag/core/session')

const { schema, mergeOptions } = require('../config/renderer')

Event.__type = 'electronrendererjs'

module.exports = (rendererOpts) => {
  if (!window.__bugsnag_ipc__) throw new Error('Bugsnag was not loaded in the main process')
  const opts = mergeOptions(window.__bugsnag_ipc__.config, rendererOpts)

  // automatic error breadcrumbs will always be duplicates if created in renderers
  // because both the renderers and main process create them for the same Event
  opts.enabledBreadcrumbTypes = opts.enabledBreadcrumbTypes.filter(type => type !== 'error')

  const internalPlugins = [
    require('@bugsnag/plugin-electron-renderer-client-state-updates')(window.__bugsnag_ipc__),
    require('@bugsnag/plugin-electron-network-status')(),
    require('@bugsnag/plugin-window-onerror')(),
    require('@bugsnag/plugin-window-unhandled-rejection')(),
    require('@bugsnag/plugin-network-breadcrumbs')(),
    require('@bugsnag/plugin-interaction-breadcrumbs')(),
    require('@bugsnag/plugin-console-breadcrumbs'),
    require('@bugsnag/plugin-electron-process-info')(window.__bugsnag_ipc__.process),
    require('@bugsnag/plugin-electron-renderer-strip-project-root'),
    require('@bugsnag/plugin-stackframe-path-normaliser'),
    require('@bugsnag/plugin-electron-renderer-event-data')(window.__bugsnag_ipc__)
  ]

  const bugsnag = new Client(opts, schema, internalPlugins, require('../id'))

  bugsnag._setDelivery(client => ({
    sendEvent (payload) {
      const payloadEvent = payload.events[0]

      // convert the Event instance into a plain object to avoid its toJSON method
      // this lets us map it exactly to an equivalent Event instance in the main process
      const event = Object.assign({}, payloadEvent)

      // include the stack in the originalError if it's an Error; the default
      // serialisation only includes 'name' and 'message'
      if (payloadEvent.originalError instanceof Error) {
        event.originalError = {
          name: payloadEvent.originalError.name,
          message: payloadEvent.originalError.message,
          stack: payloadEvent.originalError.stack
        }
      }

      window.__bugsnag_ipc__.dispatch(event)
    },
    sendSession () {
      // noop for now
    }
  }))

  // noop session delegate for now
  bugsnag._sessionDelegate = { startSession: () => bugsnag, resumeSession: () => {}, pauseSession: () => {} }

  bugsnag._logger.debug('Loaded! In renderer process.')

  return bugsnag
}

module.exports.Client = Client
module.exports.Event = Event
module.exports.Session = Session
module.exports.Breadcrumb = Breadcrumb
