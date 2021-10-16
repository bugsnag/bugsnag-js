const bugsnagInFlight = require('@bugsnag/in-flight')
const BugsnagPluginBrowserSession = require('@bugsnag/plugin-browser-session')

const BugsnagPluginAzureFunctions = {
  name: 'azureFunctions',

  load (client) {
    bugsnagInFlight.trackInFlight(client)
    client._loadPlugin(BugsnagPluginBrowserSession)

    return {
      createHandler ({ flushTimeoutMs = 2000 } = {}) {
        return wrapHandler.bind(null, client, flushTimeoutMs)
      }
    }
  }
}

// Function which takes in the Azure Function handler and wraps it with
// a new handler that automatically captures unhandled errors
function wrapHandler (client, flushTimeoutMs, handler) {
  // Reset the app duration between invocations, if the plugin is loaded
  const appDurationPlugin = client.getPlugin('appDuration')

  return async function (context, ...args) {
    if (appDurationPlugin) {
      appDurationPlugin.reset()
    }

    client.addMetadata('Azure Function context', context)

    if (client._config.autoTrackSessions) {
      client.startSession()
    }

    try {
      return await handler(context, ...args)
    } catch (err) {
      if (client._config.autoDetectErrors && client._config.enabledErrorTypes.unhandledExceptions) {
        const handledState = {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledException' }
        }

        const event = client.Event.create(err, true, handledState, 'azure functions plugin', 1)

        client._notify(event)
      }

      throw err
    } finally {
      try {
        await bugsnagInFlight.flush(flushTimeoutMs)
      } catch (err) {
        client._logger.error(`Delivery may be unsuccessful: ${err.message}`)
      }
    }
  }
}

module.exports = BugsnagPluginAzureFunctions
