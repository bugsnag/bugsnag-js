/* eslint-env worker, serviceworker */

import delivery from '@bugsnag/delivery-fetch'
import pluginClientIp from '@bugsnag/plugin-client-ip'
import pluginWindowOnError from '@bugsnag/plugin-window-onerror'
import pluginWindowUnhandledRejection from '@bugsnag/plugin-window-unhandled-rejection'

// extend the base config schema with some browser-specific options
import { schema as baseConfig } from '@bugsnag/core/config'
import workerConfig from './config'
import pluginBrowserDevice from '@bugsnag/plugin-browser-device'
import pluginBrowserSession from '@bugsnag/plugin-browser-session'
import pluginPreventDiscard from './prevent-discard'
import ClientWithInternals from '@bugsnag/core/client'
import type { Client, Config, BugsnagStatic } from '@bugsnag/core'
import assign from '@bugsnag/core/lib/es-utils/assign'

export interface WorkerConfig extends Config {
  collectUserIp?: boolean
  generateAnonymousId?: boolean
}

export interface WorkerBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | WorkerConfig): Client
  createClient(apiKeyOrOpts: string | WorkerConfig): Client
}

const name = 'Bugsnag Web Worker'
const url = 'https://github.com/bugsnag/bugsnag-js'
// @ts-ignore
const version = __BUGSNAG_NOTIFIER_VERSION__

// extend the base config schema with some worker-specific options
const schema = assign({}, baseConfig, workerConfig)

type WorkerClient = Partial<ClientWithInternals> & {
  _client: ClientWithInternals | null
  createClient: (opts?: Config) => ClientWithInternals
  start: (opts?: Config) => ClientWithInternals
  isStarted: () => boolean
}

const notifier: WorkerClient = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {} as unknown as Config

    const internalPlugins = [
      pluginBrowserDevice(navigator, null),
      pluginBrowserSession,
      pluginClientIp,
      pluginPreventDiscard,
      pluginWindowOnError(self, 'worker onerror'),
      pluginWindowUnhandledRejection(self)
    ]

    // configure a client with user supplied options
    const bugsnag = new ClientWithInternals(opts, schema, internalPlugins, { name, version, url })

    bugsnag._setDelivery(delivery)

    bugsnag._logger.debug('Loaded!')

    return bugsnag._config.autoTrackSessions
      ? bugsnag.startSession()
      : bugsnag
  },
  start: (opts) => {
    if (notifier._client) {
      notifier._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
      return notifier._client
    }
    notifier._client = notifier.createClient(opts)
    return notifier._client
  },
  isStarted: () => {
    return notifier._client != null
  }
}

type Method = keyof typeof ClientWithInternals.prototype

// Add client functions to notifier
(Object.getOwnPropertyNames(ClientWithInternals.prototype) as Method[]).forEach(method => {
  // skip private methods
  // @ts-ignore
  if (/^_/.test(method) || method === 'constructor') return
  notifier[method] = function () {
    if (!notifier._client) return console.log(`Bugsnag.${method}() was called before Bugsnag.start()`)
    notifier._client._depth += 1
    const ret = notifier._client[method].apply(notifier._client, arguments)
    notifier._client._depth -= 1
    return ret
  }
})

const Bugsnag = notifier as WorkerBugsnagStatic

export default Bugsnag
