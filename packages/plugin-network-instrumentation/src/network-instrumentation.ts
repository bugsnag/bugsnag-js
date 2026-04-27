/**
 * @bugsnag/plugin-network-instrumentation
 * A plugin to automatically capture and report HTTP errors
 */

import parseUrl from './lib/parse-url'
import parseQueryString from './lib/parse-query-string'
import redactValues from './lib/redact-values'
import shouldCaptureStatusCode from './lib/should-capture-status-code'
import truncate from './lib/truncate'
import type { Plugin, Client, Event } from '@bugsnag/core'

type HttpErrorCodes = Array<{ min: number, max: number }> | { min: number, max: number } | number

interface PluginConfig {
  httpErrorCodes?: HttpErrorCodes
  maxResponseSize?: number
  maxRequestSize?: number
  onHttpError?: (args: { request: any, response: any }) => boolean | void
}

const DEFAULT_HTTP_ERROR_CODES = [{ min: 400, max: 599 }]
const DEFAULT_MAX_RESPONSE_SIZE = 0
const DEFAULT_MAX_REQUEST_SIZE = 0

const networkInstrumentation = (
  config: PluginConfig = {},
  global: any = typeof window !== 'undefined' ? window : undefined
): Plugin => {
  const {
    httpErrorCodes = DEFAULT_HTTP_ERROR_CODES,
    maxResponseSize = DEFAULT_MAX_RESPONSE_SIZE,
    maxRequestSize = DEFAULT_MAX_REQUEST_SIZE,
    onHttpError
  } = config

  // Normalize httpErrorCodes to an array
  const normalizedStatusCodes = Array.isArray(httpErrorCodes) ? httpErrorCodes : [httpErrorCodes]

  let restoreFunctions: Array<() => void> = []
  const plugin: Plugin = {
    name: 'httpErrors',
    load: (client: Client) => {
      // Try to get existing request tracker
      let requestTrackerPlugin = client.getPlugin && client.getPlugin('requestTracker')

      // Auto-load request tracker if not present
      if (!requestTrackerPlugin) {
        try {
          // @ts-ignore
          const { createRequestTrackerPlugin } = require('@bugsnag/request-tracker')
          const trackerPlugin = createRequestTrackerPlugin([], global)
          // @ts-ignore
          client._loadPlugin(trackerPlugin)
          requestTrackerPlugin = client.getPlugin && client.getPlugin('requestTracker')
        } catch (error: any) {
          client._logger?.warn?.('Failed to auto-load request tracker, using direct fetch patching:', error.message)
        }
      }

      // Use shared request tracker if available
      if (requestTrackerPlugin) {
        const { fetchTracker, xhrTracker } = requestTrackerPlugin

        if (fetchTracker) {
          restoreFunctions.push(fetchTracker._restore)
          fetchTracker.onStart((startContext: any) => {
            return {
              onRequestEnd: (endContext: any) => {
                handleHttpError(startContext, endContext)
              }
            }
          })
        }
        if (xhrTracker) {
          restoreFunctions.push(xhrTracker._restore)
          xhrTracker.onStart((startContext: any) => {
            return {
              onRequestEnd: (endContext: any) => {
                handleHttpError(startContext, endContext)
              }
            }
          })
        }
      }

      function handleHttpError (startContext: any, endContext: any) {
        // Check if we should capture this status code
        if (!shouldCaptureStatusCode(normalizedStatusCodes, endContext.status)) return

        try {
          // Extract request information
          const originalUrl = startContext.url
          const { domain, cleanUrl, queryString } = parseUrl(originalUrl)
          const url = cleanUrl
          const method = startContext.method

          // Parse query string into object
          const requestParams = parseQueryString(queryString)

          // Create request and response objects for callback
          const requestObj = {
            url,
            httpMethod: method,
            headers: startContext.headers,
            params: redactValues(requestParams, client._config.redactedKeys),
            bodyLength: startContext.body ? startContext.body.length : undefined
          }
          const responseObj = {
            statusCode: endContext.status,
            headers: endContext.headers,
            bodyLength: endContext.body ? endContext.body.length : undefined
          }

          // Call onHttpError callback if provided
          if (onHttpError) {
            const result = onHttpError({ request: requestObj, response: responseObj })

            // If onHttpError returns false, don't capture
            if (result === false) {
              return
            }
          }

          // Truncate request body
          if (maxRequestSize > 0 && startContext.body) {
            requestObj.body = truncate(startContext.body, maxRequestSize)
          }

          // Truncate response body - XHR only
          if (maxResponseSize > 0 && endContext.body) {
            responseObj.body = truncate(endContext.body, maxResponseSize)
          }

          // Create error and notify
          const error = new Error(`${responseObj.statusCode}: ${url}`)
          error.name = 'HTTPError'

          const handledState = {
            severity: 'error',
            unhandled: false,
            severityReason: { type: 'httpError' }
          }

          // @ts-ignore
          const event: Event = client.Event.create(
            error,
            true,
            handledState,
            'http errors plugin',
            0
          )

          event.errors[0].stacktrace = [] // Omit the stacktrace for HTTP errors
          event.request = requestObj
          event.response = responseObj
          event.context = `${method} ${domain}`

          client._notify(event)
        } catch (err: any) {
          client._logger?.error?.('Failed to process HTTP error:', err.message)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    (plugin as any).destroy = () => {
      restoreFunctions.forEach(fn => fn())
      restoreFunctions = []
    }
  }

  return plugin
}

export default networkInstrumentation