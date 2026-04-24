import { Client } from '@bugsnag/core'
import RequestTracker from './request-tracker'
import createFetchTracker from './fetch-tracker'
import createXhrTracker from './xhr-tracker'
import { createUrlFilter, getDuration } from './url-helpers'

export interface RequestTrackerPluginResult {
  fetchTracker: RequestTracker | undefined
  xhrTracker: RequestTracker | undefined
  urlFilter: (url: string) => boolean
  getDuration: typeof getDuration
}

interface GlobalWithFetchAndXHR {
  fetch: typeof fetch
  XMLHttpRequest: typeof XMLHttpRequest
  WeakMap: typeof WeakMap
}

function createRequestTrackerPlugin (ignoredUrls: string[] = [], global: GlobalWithFetchAndXHR = window) {
  return {
    name: 'requestTracker',
    load: (client: Client): RequestTrackerPluginResult => {
      try {
        const fetchTracker = createFetchTracker(global as any)
        const xhrTracker = createXhrTracker(global as any)
        const urlFilter = createUrlFilter(client, ignoredUrls)

        return {
          fetchTracker,
          xhrTracker,
          urlFilter,
          getDuration
        }
      } catch (error) {
        client._logger.error('Failed to load request tracker:', error)
        throw new Error('Request tracking is not available: ' + (error as Error).message)
      }
    }
  }
}

export {
  RequestTracker,
  createFetchTracker,
  createXhrTracker,
  createUrlFilter,
  getDuration,
  createRequestTrackerPlugin
}

export type { RequestStartContext, RequestEndContext, StartCallbackResult, StartCallback, StartResult } from './request-tracker'
