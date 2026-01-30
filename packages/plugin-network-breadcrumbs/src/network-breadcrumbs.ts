import type { Client, Config, Logger, Plugin } from '@bugsnag/core'

const BREADCRUMB_TYPE = 'request'

interface GlobalWithFetchAndXHR {
  fetch: typeof fetch
  XMLHttpRequest: typeof XMLHttpRequest
  WeakMap: typeof WeakMap
}

interface InternalClient extends Client {
  _logger: Logger
  _config: Required<Config>
  _isBreadcrumbTypeEnabled: (type: string) => boolean
}

type FetchArguments = Parameters<Window['fetch']>

/*
 * Leaves breadcrumbs when network requests occur
 */
export default (_ignoredUrls: string[] = [], win: GlobalWithFetchAndXHR = window): Plugin => {
  let restoreFunctions: Array<() => void> = []
  const plugin: Plugin = {
    load: client => {
      const internalClient = client as InternalClient

      if (!internalClient._isBreadcrumbTypeEnabled('request')) return

      // Try to get existing request tracker
      let requestTrackerPlugin = client.getPlugin('requestTracker')

      // Auto-load request tracker if not present
      if (!requestTrackerPlugin) {
        try {
          const { createRequestTrackerPlugin } = require('@bugsnag/request-tracker')
          const trackerPlugin = createRequestTrackerPlugin(_ignoredUrls, win)
          client._loadPlugin(trackerPlugin)
          requestTrackerPlugin = client.getPlugin('requestTracker')
        } catch (error) {
          client._logger.warn('Failed to auto-load request tracker, falling back to direct monkey-patching:', error.message)
        }
      }

      if (requestTrackerPlugin) {
        return useSharedRequestTracker(requestTrackerPlugin)
      }

      function useSharedRequestTracker (trackerPlugin) {
        const { fetchTracker, xhrTracker, urlFilter, getDuration } = trackerPlugin

        const handleRequest = (startContext) => {
          if (urlFilter(startContext.url)) return

          return {
            onRequestEnd: (response) => {
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
              } else if (response.status >= 400) {
                client.leaveBreadcrumb(`${request} failed`, metadata, BREADCRUMB_TYPE)
              } else {
                client.leaveBreadcrumb(`${request} succeeded`, metadata, BREADCRUMB_TYPE)
              }
            }
          }
        }

        if (fetchTracker) {
          fetchTracker.onStart(handleRequest)
          restoreFunctions.push(fetchTracker._restore)
        }
        if (xhrTracker) {
          xhrTracker.onStart(handleRequest)
          restoreFunctions.push(xhrTracker._restore)
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
