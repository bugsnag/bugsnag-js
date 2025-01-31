import { AsyncLocalStorage } from 'node:async_hooks'

import assign from '@bugsnag/core/lib/es-utils/assign'

// extend the base config schema with some browser-specific options
import { schema as baseConfig } from '@bugsnag/core/config'
import browserConfig from './config'

import Event from '@bugsnag/core/event'

import delivery from '@bugsnag/delivery-node'

import pluginApp from '@bugsnag/plugin-app-duration'
import pluginSurroundingCode from '@bugsnag/plugin-node-surrounding-code'
import pluginInProject from '@bugsnag/plugin-node-in-project'
import pluginStripProjectRoot from '@bugsnag/plugin-strip-project-root'
import pluginServerSession from '@bugsnag/plugin-server-session'
import pluginNodeDevice from '@bugsnag/plugin-node-device'
import pluginNodeUncaughtException from '@bugsnag/plugin-node-uncaught-exception'
import pluginNodeUnhandledRejection from '@bugsnag/plugin-node-unhandled-rejection'
import pluginIntercept from '@bugsnag/plugin-intercept'
import pluginContextualize from '@bugsnag/plugin-contextualize'
import pluginStackframePathNormaliser from '@bugsnag/plugin-stackframe-path-normaliser'
import pluginConsoleBreadcrumbs from '@bugsnag/plugin-console-breadcrumbs'
import { BugsnagStatic, Config, Logger } from '@bugsnag/core'
import ClientWithInternals from '@bugsnag/core/client'

type AfterErrorCb = (err: any, event: Event, logger: Logger) => void;

const schema = assign({}, baseConfig, browserConfig)

export interface NodeConfig extends Config {
  hostname?: string
  onUncaughtException?: AfterErrorCb
  onUnhandledRejection?: AfterErrorCb
  agent?: any
  projectRoot?: string
  sendCode?: boolean
}

export interface NodeBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | NodeConfig): ClientWithInternals
  createClient(apiKeyOrOpts: string | NodeConfig): ClientWithInternals
}

const name = 'Bugsnag Node'
// @ts-ignore
const version = __BUGSNAG_NOTIFIER_VERSION__
const url = 'https://github.com/bugsnag/bugsnag-js'

// @ts-ignore
Event.__type = 'nodejs'

// extend the base config schema with some node-specific options
const internalPlugins = [
  pluginApp,
  pluginSurroundingCode,
  pluginInProject,
  pluginStripProjectRoot,
  pluginServerSession,
  pluginNodeDevice,
  pluginNodeUncaughtException,
  pluginNodeUnhandledRejection,
  pluginIntercept,
  pluginContextualize,
  pluginStackframePathNormaliser,
  pluginConsoleBreadcrumbs
]

type NodeClient = Partial<ClientWithInternals> & {
  _client: ClientWithInternals | null
  createClient: (opts?: Config) => ClientWithInternals
  start: (opts?: Config) => ClientWithInternals
  isStarted: () => boolean
}

type Method = keyof typeof ClientWithInternals.prototype

const notifier: NodeClient = {
  _client: null,
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {} as unknown as Config

    const bugsnag = new ClientWithInternals(opts, schema, internalPlugins, { name, version, url });

    /**
     * Patch all calls to the client in order to forwards them to the context client if it exists
     *
     * This is useful for when client methods are called later, such as in the console breadcrumbs
     * plugin where we want to call `leaveBreadcrumb` on the request-scoped client, if it exists.
     */
    (Object.keys(ClientWithInternals.prototype) as Method[]).forEach((m) => {
      const original = notifier[m]
      bugsnag[m] = function () {
        // if we are in an async context, use the client from that context
        const contextClient = bugsnag._clientContext && typeof bugsnag._clientContext.getStore === 'function' ? bugsnag._clientContext.getStore() : null
        const client = contextClient || bugsnag
        const originalMethod = contextClient ? contextClient[m] : original

        client._depth += 1
        const ret = originalMethod.apply(client, arguments)
        client._depth -= 1
        return ret
      }
    })

    // Used to store and retrieve the request-scoped client which makes it easy to obtain the request-scoped client
    // from anywhere in the codebase e.g. when calling Bugsnag.leaveBreadcrumb() or even within the global unhandled
    // promise rejection handler.
    bugsnag._clientContext = new AsyncLocalStorage()

    bugsnag._setDelivery(delivery)

    bugsnag._logger.debug('Loaded!')

    return bugsnag
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

;(Object.keys(ClientWithInternals.prototype) as Method[]).forEach((m) => {
  if (/^_/.test(m)) return
  notifier[m] = function () {
    // if we are in an async context, use the client from that context
    let client = notifier._client
    const ctx = client && client._clientContext && client._clientContext.getStore()
    if (ctx) {
      client = ctx
    }

    if (!client) return console.error(`Bugsnag.${m}() was called before Bugsnag.start()`)

    client._depth += 1
    const ret = client[m].apply(client, arguments)
    client._depth -= 1
    return ret
  }
})

const Bugsnag = notifier as NodeBugsnagStatic

export default Bugsnag
