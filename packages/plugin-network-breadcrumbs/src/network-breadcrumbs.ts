import type { Plugin } from '@bugsnag/core'
import { createRequestTrackerPlugin, RequestTrackerPluginResult } from '@bugsnag/request-tracker'
import type { RequestStartContext, RequestEndContext } from '@bugsnag/request-tracker'

const BREADCRUMB_TYPE = 'request'

interface GlobalWithFetchAndXHR {
  fetch: typeof fetch
  XMLHttpRequest: typeof XMLHttpRequest
  WeakMap: typeof WeakMap
}

/*
 * Leaves breadcrumbs when network requests occur
 */
export default (_ignoredUrls: string[] = [], win: GlobalWithFetchAndXHR = window): Plugin => {
  let restoreFunctions: Array<() => void> = []
  const plugin: Plugin = {
    load: client => {
      if (!client._isBreadcrumbTypeEnabled('request')) return

      // Try to get existing request tracker
      let requestTrackerPlugin = client.getPlugin('requestTracker') as RequestTrackerPluginResult | undefined

      // Auto-load request tracker if not present
      if (!requestTrackerPlugin) {
        try {
          const trackerPlugin = createRequestTrackerPlugin(_ignoredUrls, win)
          client._loadPlugin(trackerPlugin)
          requestTrackerPlugin = client.getPlugin('requestTracker') as RequestTrackerPluginResult | undefined
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          client._logger.warn(`Failed to auto-load request tracker, falling back to direct monkey-patching: ${message}`)
        }
      }

      if (requestTrackerPlugin) {
        useSharedRequestTracker(requestTrackerPlugin)
      }

      function useSharedRequestTracker (trackerPlugin: RequestTrackerPluginResult) {
        const { fetchTracker, xhrTracker, urlFilter, getDuration } = trackerPlugin

        const handleRequest = (startContext: RequestStartContext) => {
          if (urlFilter(startContext.url)) return null

          return {
            onRequestEnd: (response: RequestEndContext) => {
              const duration = getDuration(startContext.startTime)
              const metadata = {
                method: startContext.method,
                status: response.status,
                url: startContext.url,
                duration
              }

              const request = startContext.type === 'fetch' ? 'fetch()' : 'XMLHttpRequest'

              if (response.state === 'error') {
                client.leaveBreadcrumb(`${request} error`, { method: startContext.method, url: startContext.url, duration }, BREADCRUMB_TYPE)
              } else if (response.status && response.status >= 400) {
                client.leaveBreadcrumb(`${request} failed`, metadata, BREADCRUMB_TYPE)
              } else {
                client.leaveBreadcrumb(`${request} succeeded`, metadata, BREADCRUMB_TYPE)
              }
            }
          }
        }

        if (fetchTracker) {
          fetchTracker.onStart(handleRequest)
          if (fetchTracker._restore) restoreFunctions.push(fetchTracker._restore)
        }
        if (xhrTracker) {
          xhrTracker.onStart(handleRequest)
          if (xhrTracker._restore) restoreFunctions.push(xhrTracker._restore)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    plugin.destroy = () => {
      restoreFunctions.forEach(fn => fn())
      restoreFunctions = []
    }
  }

  return plugin
}
