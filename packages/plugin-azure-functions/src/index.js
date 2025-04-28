const bugsnagInFlight = require('@bugsnag/in-flight')
const clone = require('@bugsnag/core/lib/clone-client')

const BugsnagPluginAzureFunctions = {
  name: 'azureFunctions',

  load (client) {
    bugsnagInFlight.trackInFlight(client)

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
    // Get a client to be scoped to this function invocation. If sessions are enabled, use the
    // resumeSession() call to get a session client, otherwise, clone the existing client.
    const functionClient = client._config.autoTrackSessions ? client.resumeSession() : clone(client)

    if (appDurationPlugin) {
      appDurationPlugin.reset()
    }

    // Attach the client to the context
    context.bugsnag = functionClient

    // Add global metadata attach the context
    functionClient.addOnError(event => {
      event.addMetadata('Azure Function context', context)
      event.clearMetadata('Azure Function context', 'bugsnag')
    })

    try {
      return await handler(context, ...args)
    } catch (err) {
      if (client._config.autoDetectErrors && client._config.enabledErrorTypes.unhandledExceptions) {
        const handledState = {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledException' }
        }

        const event = functionClient.Event.create(err, true, handledState, 'azure functions plugin', 1)

        functionClient._notify(event)
      }

      throw err
    } finally {
      try {
        await bugsnagInFlight.flush(flushTimeoutMs)
      } catch (err) {
        functionClient._logger.error(`Delivery may be unsuccessful: ${err.message}`)
      }
    }
  }
}

module.exports = BugsnagPluginAzureFunctions
