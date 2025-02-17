import { BugsnagStatic, Config, Client, schema as baseConfig } from '@bugsnag/core'

// extend the base config schema with some browser-specific options
import browserConfig from './config'

import pluginWindowOnerror from '@bugsnag/plugin-window-onerror'
import pluginUnhandledRejection from '@bugsnag/plugin-window-unhandled-rejection'
import pluginApp from '@bugsnag/plugin-app-duration'
import pluginDevice from '@bugsnag/plugin-browser-device'
import pluginContext from '@bugsnag/plugin-browser-context'
import pluginRequest from '@bugsnag/plugin-browser-request'
import pluginThrottle from '@bugsnag/plugin-simple-throttle'
import pluginConsoleBreadcrumbs from '@bugsnag/plugin-console-breadcrumbs'
import pluginNetworkBreadcrumbs from '@bugsnag/plugin-network-breadcrumbs'
import pluginNavigationBreadcrumbs from '@bugsnag/plugin-navigation-breadcrumbs'
import pluginInteractionBreadcrumbs from '@bugsnag/plugin-interaction-breadcrumbs'
import pluginInlineScriptContent from '@bugsnag/plugin-inline-script-content'
import pluginSession from '@bugsnag/plugin-browser-session'
import pluginIp from '@bugsnag/plugin-client-ip'
import pluginStripQueryString from '@bugsnag/plugin-strip-query-string'

// delivery mechanisms
import dXDomainRequest from '@bugsnag/delivery-x-domain-request'
import dXMLHttpRequest from '@bugsnag/delivery-xml-http-request'

const name = 'Bugsnag JavaScript'
const version = '__BUGSNAG_NOTIFIER_VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const schema = { ...baseConfig, ...browserConfig }

export interface BrowserConfig extends Config {
  maxEvents?: number
  collectUserIp?: boolean
  generateAnonymousId?: boolean
  trackInlineScripts?: boolean
  sendPayloadChecksums?: boolean
}

export interface BrowserBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | BrowserConfig): Client
  createClient(apiKeyOrOpts: string | BrowserConfig): Client
}

declare global {
  interface Window {
    XDomainRequest: unknown
  }
}

type BrowserClient = Partial<Client> & {
  _client: Client | null
  createClient: (opts?: Config) => Client
  start: (opts?: Config) => Client
  isStarted: () => boolean
}

const notifier: BrowserClient = {
  _client: null,
  // @ts-ignore
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {} as unknown as Config

    const internalPlugins = [
      // add browser-specific plugins
      pluginApp,
      pluginDevice(),
      pluginContext(),
      pluginRequest(),
      pluginThrottle,
      pluginSession,
      pluginIp,
      pluginStripQueryString,
      pluginWindowOnerror(),
      pluginUnhandledRejection(),
      pluginNavigationBreadcrumbs(),
      pluginInteractionBreadcrumbs(),
      pluginNetworkBreadcrumbs(),
      pluginConsoleBreadcrumbs,

      // this one added last to avoid wrapping functionality before bugsnag uses it
      pluginInlineScriptContent()
    ]

    // configure a client with user supplied options
    // @ts-expect-error
    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url });

    // set delivery based on browser capability (IE 8+9 have an XDomainRequest object)
    // @ts-expect-error
    (bugsnag as BrowserClient)._setDelivery?.(window.XDomainRequest ? dXDomainRequest : dXMLHttpRequest)

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
  // @ts-expect-error
  notifier[m] = function () {
    if (!notifier._client) return console.log(`Bugsnag.${m}() was called before Bugsnag.start()`)
    notifier._client._depth += 1
    // @ts-expect-error
    const ret = notifier._client[m].apply(notifier._client, arguments)
    notifier._client._depth -= 1
    return ret
  }
})

// @ts-expect-error
const Bugsnag = notifier as BrowserBugsnagStatic

export default Bugsnag
