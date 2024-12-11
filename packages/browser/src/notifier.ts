import Client from '@bugsnag/core/client'
// import Event from '@bugsnag/core/event'
// import Session from '@bugsnag/core/session'
// import Breadcrumb from '@bugsnag/core/breadcrumb'
import { Config } from '@bugsnag/core/types'

import map from '@bugsnag/core/lib/es-utils/map'
import keys from '@bugsnag/core/lib/es-utils/keys'
import assign from '@bugsnag/core/lib/es-utils/assign'

// extend the base config schema with some browser-specific options
import { schema as baseConfig } from '@bugsnag/core/config'
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
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const schema = assign({}, baseConfig, browserConfig)

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
  _setDelivery?: (handler: typeof dXDomainRequest | typeof dXMLHttpRequest) => void
}

const Bugsnag: BrowserClient = {
  _client: null,
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
    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url });

    // set delivery based on browser capability (IE 8+9 have an XDomainRequest object)
    (bugsnag as BrowserClient)._setDelivery?.(window.XDomainRequest ? dXDomainRequest : dXMLHttpRequest)

    bugsnag._logger.debug('Loaded!')
    bugsnag.leaveBreadcrumb('Bugsnag loaded', {}, 'state')

    return bugsnag._config.autoTrackSessions
      ? bugsnag.startSession()
      : bugsnag
  },
  start: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
      return Bugsnag._client
    }
    Bugsnag._client = Bugsnag.createClient(opts)
    return Bugsnag._client
  },
  isStarted: () => {
    return Bugsnag._client != null
  }
}

type Method = keyof typeof Client.prototype

map(['resetEventCount'].concat(keys(Client.prototype)) as Method[], (m) => {
  if (/^_/.test(m)) return
  Bugsnag[m] = function () {
    if (!Bugsnag._client) return console.log(`Bugsnag.${m}() was called before Bugsnag.start()`)
    Bugsnag._client._depth += 1
    const ret = Bugsnag._client[m].apply(Bugsnag._client, arguments)
    Bugsnag._client._depth -= 1
    return ret
  }
})

// export { Client, Event, Session, Breadcrumb, Bugsnag }

export default Bugsnag
