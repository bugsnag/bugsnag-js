const bugsnagInFlight = require('@bugsnag/in-flight')
const BugsnagPluginBrowserSession = require('@bugsnag/plugin-browser-session')

const SERVER_PLUGIN_NAMES = ['express', 'koa', 'restify', 'hono']
const isServerPluginLoaded = client => SERVER_PLUGIN_NAMES.some(name => client.getPlugin(name))

const extractRequestInfo = (request) => {
  if (!request) return {}

  const url = new URL(request.url)

  const info = {
    url: request.url,
    path: url.pathname,
    httpMethod: request.method,
    headers: Object.fromEntries(request.headers),
    query: url.searchParams.size > 0 ? Object.fromEntries(url.searchParams) : undefined,
    clientIp: request.headers.get('Cf-Connecting-IP') || request.headers.get('X-Forwarded-For') || undefined
  }

  return info
}

const getRequestAndMetadataFromReq = (request) => {
  const requestInfo = extractRequestInfo(request)

  return {
    metadata: requestInfo,
    request: {
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      url: requestInfo.url
    }
  }
}

const BugsnagPluginCloudflareWorkers = {
  name: 'cloudflareWorkers',

  load (client) {
    bugsnagInFlight.trackInFlight(client)
    client._loadPlugin(BugsnagPluginBrowserSession)

    // Reset the app duration between invocations, if the plugin is loaded
    const appDurationPlugin = client.getPlugin('appDuration')

    if (appDurationPlugin) {
      appDurationPlugin.reset()
    }

    return {
      createHandler ({ flushTimeoutMs = 2000 } = {}) {
        return wrapHandler.bind(null, client, flushTimeoutMs)
      }
    }
  }
}

function wrapHandler (client, flushTimeoutMs, handler) {
  return async function (request, env, ctx) {
    // Add request metadata via onError callback so server plugins can override
    // Only add metadata if no server plugin is loaded
    if (!isServerPluginLoaded(client)) {
      client.addOnError((event) => {
        const { metadata, request: requestData } = getRequestAndMetadataFromReq(request)
        event.request = { ...event.request, ...requestData }
        event.addMetadata('request', metadata)
      }, true)
    }

    // Track sessions if autoTrackSessions is enabled and no server plugin is loaded
    if (client._config.autoTrackSessions && !isServerPluginLoaded(client)) {
      client.startSession()
    }

    try {
      return await handler(request, env, ctx)
    } catch (err) {
      if (client._config.autoDetectErrors && client._config.enabledErrorTypes.unhandledExceptions) {
        const handledState = {
          severity: 'error',
          unhandled: true,
          severityReason: { type: 'unhandledException' }
        }

        const event = client.Event.create(err, true, handledState, 'cloudflare workers plugin', 1)

        client._notify(event)
      }

      throw err
    } finally {
      // Use ctx.waitUntil to ensure flush completes even after response is returned
      // This is critical for Cloudflare Workers as they can terminate immediately
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(
          bugsnagInFlight.flush(flushTimeoutMs).catch(err => {
            client._logger.error(`Delivery may be unsuccessful: ${err.message}`)
          })
        )
      } else {
        try {
          await bugsnagInFlight.flush(flushTimeoutMs)
        } catch (err) {
          client._logger.error(`Delivery may be unsuccessful: ${err.message}`)
        }
      }
    }
  }
}

module.exports = BugsnagPluginCloudflareWorkers

// add a default export for ESM modules without interop
module.exports.default = module.exports
