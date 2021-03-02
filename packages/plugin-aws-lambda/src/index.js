const bugsnagInFlight = require('@bugsnag/in-flight')

const BugsnagPluginAwsLambda = {
  name: 'awsLambda',

  load (client) {
    bugsnagInFlight.trackInFlight(client)

    return {
      createHandler ({ flushTimeoutMs = 2000 } = {}) {
        return wrapHandler.bind(null, client, flushTimeoutMs)
      }
    }
  }
}

function wrapHandler (client, flushTimeoutMs, handler) {
  let _handler = handler

  if (handler.length > 2) {
    // This is a handler expecting a 'callback' argument, so we convert
    // it to return a Promise so '_handler' always has the same API
    _handler = promisifyHandler(handler)
  }

  return async function (event, context) {
    client.addMetadata('AWS Lambda context', context)

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
