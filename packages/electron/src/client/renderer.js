const Event = require('@bugsnag/core/event')
const { Breadcrumb, Client } = require('@bugsnag/core')
const Session = require('@bugsnag/core/session')

const createClient = require('./createClient')

const { schema, mergeOptions } = require('../config/renderer')

Event.__type = 'electronrendererjs'

const createRendererClient = (rendererOpts) => {
  if (!window.__bugsnag_ipc__) throw new Error('Bugsnag was not loaded in the main process')

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

  const additionalSchemaKeys = internalPlugins.reduce((schemaKeys, plugin) => {
    if (plugin.configSchema) {
      return schemaKeys.concat(Object.keys(plugin.configSchema))
    }

    return schemaKeys
  }, [])

  const opts = mergeOptions(additionalSchemaKeys, window.__bugsnag_ipc__.config, rendererOpts)

  // automatic error breadcrumbs will always be duplicates if created in renderers
  // because both the renderers and main process create them for the same Event
  if (opts.enabledBreadcrumbTypes !== null) {
    opts.enabledBreadcrumbTypes = opts.enabledBreadcrumbTypes.filter(type => type !== 'error')
  }

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

  // the types will show that the renderer has this method, but it only works in main
  bugsnag.markLaunchComplete = () => {
    bugsnag._logger.warn('Bugsnag.markLaunchComplete() can only be called in the main process')
  }

  bugsnag._logger.debug('Loaded! In renderer process.')

  return bugsnag
}

// Construct the client
const Bugsnag = createClient(createRendererClient, 'renderer')

// commonjs
module.exports = Bugsnag

module.exports.Client = Client
module.exports.Event = Event
module.exports.Breadcrumb = Breadcrumb
module.exports.Session = Session

// ESM
module.exports.default = Bugsnag
