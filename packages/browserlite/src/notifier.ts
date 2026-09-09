import { BugsnagStatic, Config, Client, schema as baseConfig } from '@bugsnag/core'

// extend the base config schema with some browser-specific options
import browserConfig from './config'

// only the plugins required for basic error capture are bundled by default.
// everything else (breadcrumbs, device/context metadata, sessions,
// client IP collection, etc.) can be added on demand via the `plugins`
// config option, keeping the default bundle as small as possible.
import pluginWindowOnerror from '@bugsnag/plugin-window-onerror'
import pluginUnhandledRejection from '@bugsnag/plugin-window-unhandled-rejection'

// delivery mechanism
import dXMLHttpRequest from '@bugsnag/delivery-xml-http-request'

const name = 'Bugsnag JavaScript (lite)'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const schema = { ...baseConfig, ...browserConfig }

export interface BrowserLiteConfig extends Config {
  maxEvents?: number
}

export interface BrowserLiteBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | BrowserLiteConfig): Client
  createClient(apiKeyOrOpts: string | BrowserLiteConfig): Client
}

type BrowserLiteClient = Partial<Client> & {
  _client: Client | null
  createClient: (opts?: string | BrowserLiteConfig) => Client
  start: (opts?: string | BrowserLiteConfig) => Client
  isStarted: () => boolean
}

const notifier: BrowserLiteClient = {
  _client: null,
  // @ts-expect-error createClient returns Client but BrowserLiteClient type expects different signature
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {} as unknown as BrowserLiteConfig

    const internalPlugins = [
      pluginWindowOnerror(),
      pluginUnhandledRejection()
    ]

    // configure a client with user supplied options
    // @ts-expect-error schema includes browser-specific keys not in the base Config type
    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url });

    // @ts-expect-error _setDelivery is not in Partial<Client> but exists on the Client instance
    (bugsnag as BrowserLiteClient)._setDelivery?.(dXMLHttpRequest)

    bugsnag._logger.debug('Loaded!')
    bugsnag.leaveBreadcrumb('Bugsnag loaded', {}, 'state')

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

const clientMethods = Object.getOwnPropertyNames(Client.prototype).concat(['resetEventCount'])

clientMethods.map((m) => {
  if (/^_/.test(m) || m === 'constructor') return
  // @ts-expect-error dynamically assigning Client methods to the notifier object
  notifier[m] = function () {
    if (!notifier._client) return console.log(`Bugsnag.${m}() was called before Bugsnag.start()`)
    notifier._client._depth += 1
    // @ts-expect-error dynamically calling Client method by string name
    const ret = notifier._client[m].apply(notifier._client, arguments)
    notifier._client._depth -= 1
    return ret
  }
})

// @ts-expect-error BrowserLiteClient is a partial type that gets methods added dynamically
const Bugsnag = notifier as BrowserLiteBugsnagStatic

export default Bugsnag
