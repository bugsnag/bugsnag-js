const bugsnagInFlight = require('@bugsnag/in-flight')
const BugsnagPluginAwsLambdaSession = require('./session')
const LambdaTimeoutApproaching = require('./lambda-timeout-approaching')
const isServerPluginLoaded = require('./is-server-plugin-loaded')

// JS timers use a signed 32 bit integer for the millisecond parameter. SAM's
// "local invoke" has a bug that means it exceeds this amount, resulting in
// warnings. See https://github.com/aws/aws-sam-cli/issues/2519
const MAX_TIMER_VALUE = Math.pow(2, 31) - 1

const BugsnagPluginAwsLambda = {
  name: 'awsLambda',

  load (client) {
    bugsnagInFlight.trackInFlight(client)
    client._loadPlugin(BugsnagPluginAwsLambdaSession)

    // Reset the app duration between invocations, if the plugin is loaded
    const appDurationPlugin = client.getPlugin('appDuration')

    if (appDurationPlugin) {
      appDurationPlugin.reset()
    }

    // AWS add a default unhandledRejection listener that forcefully exits the
    // process. This breaks reporting of unhandled rejections, so we have to
    // remove all existing listeners and call them after we handle the rejection
    if (client._config.autoDetectErrors && client._config.enabledErrorTypes.unhandledRejections) {
      const listeners = process.listeners('unhandledRejection')
      process.removeAllListeners('unhandledRejection')

      // This relies on our unhandled rejection plugin adding its listener first
      // using process.prependListener, so we can call it first instead of AWS'
      process.on('unhandledRejection', async (reason, promise) => {
        for (const listener of listeners) {
          await listener.call(process, reason, promise)
        }
      })
    }

    // same for uncaught exceptions
    if (client._config.autoDetectErrors && client._config.enabledErrorTypes.unhandledExceptions) {
      const listeners = process.listeners('uncaughtException')
      process.removeAllListeners('uncaughtException')

      // This relies on our unhandled rejection plugin adding its listener first
      // using process.prependListener, so we can call it first instead of AWS'
      process.on('uncaughtException', async (reason, promise) => {
        for (const listener of listeners) {
          await listener.call(process, reason, promise)
        }
      })
    }

    return {
      createHandler ({ flushTimeoutMs = 2000, lambdaTimeoutNotifyMs = 1000 } = {}) {
        return wrapHandler.bind(null, client, flushTimeoutMs, lambdaTimeoutNotifyMs)
      }
    }
  }
}

function wrapHandler (client, flushTimeoutMs, lambdaTimeoutNotifyMs, handler) {
  let _handler = handler

  if (handler.length > 2) {
    // This is a handler expecting a 'callback' argument, so we convert
    // it to return a Promise so '_handler' always has the same API
    _handler = promisifyHandler(handler)
  }

  return async function (event, context) {
    let lambdaTimeout

    // Guard against the "getRemainingTimeInMillis" being missing. This should
    // never happen but could when unit testing
    if (typeof context.getRemainingTimeInMillis === 'function' &&
      lambdaTimeoutNotifyMs > 0
    ) {
      const timeoutMs = context.getRemainingTimeInMillis() - lambdaTimeoutNotifyMs

      if (timeoutMs <= MAX_TIMER_VALUE) {
        lambdaTimeout = setTimeout(function () {
          const handledState = {
            severity: 'warning',
            unhandled: true,
            severityReason: { type: 'log' }
          }

          const event = client.Event.create(
            new LambdaTimeoutApproaching(context.getRemainingTimeInMillis()),
            true,
            handledState,
            'aws lambda plugin',
            0
          )

          event.context = context.functionName || 'Lambda timeout approaching'

          client._notify(event)
        }, timeoutMs)
      }
    }

    client.addMetadata('AWS Lambda context', context)

    // track sessions if autoTrackSessions is enabled and no server plugin is
    // loaded - the server plugins handle starting sessions automatically, so
    // we don't need to start one as well
    if (client._config.autoTrackSessions && !isServerPluginLoaded(client)) {
      client.startSession()
    }

    try {
      return await _handler(event, context)
    } catch (err) {
      if (client._config.autoDetectErrors && client._config.enabledErrorTypes.unhandledExceptions) {
        const handledState = {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledException' }
        }

        const event = client.Event.create(err, true, handledState, 'aws lambda plugin', 1)

        client._notify(event)
      }

      throw err
    } finally {
      if (lambdaTimeout) {
        clearTimeout(lambdaTimeout)
      }

      try {
        await bugsnagInFlight.flush(flushTimeoutMs)
      } catch (err) {
        client._logger.error(`Delivery may be unsuccessful: ${err.message}`)
      }
    }
  }
}

// Convert a handler that uses callbacks to an async handler
function promisifyHandler (handler) {
  return function (event, context) {
    return new Promise(function (resolve, reject) {
      const result = handler(event, context, function (err, response) {
        if (err) {
          reject(err)
          return
        }

        resolve(response)
      })

      // Handle an edge case where the passed handler has the callback parameter
      // but actually returns a promise. In this case we need to resolve/reject
      // based on the returned promise instead of in the callback
      if (isPromise(result)) {
        result.then(resolve).catch(reject)
      }
    })
  }
}

function isPromise (value) {
  return (typeof value === 'object' || typeof value === 'function') &&
    typeof value.then === 'function' &&
    typeof value.catch === 'function'
}

module.exports = BugsnagPluginAwsLambda

// add a default export for ESM modules without interop
module.exports.default = module.exports
