
import type { Config, Plugin } from '@bugsnag/core'
import Client from '@bugsnag/core/client'
import { schema as coreSchema } from '@bugsnag/core/config'
import delivery from '@bugsnag/delivery-fetch'

const name = 'Bugsnag JavaScript'
const version = '7.18.0' // TODO: Get version dynamically
const url = 'https://github.com/bugsnag/bugsnag-js'

// extend the base config schema with some worker-specific options
const schema = { ...coreSchema }

// TODO: Fix interface - extend off ClientWithInternals?
interface Notifier {
  _client: Client | null
  createClient: (opts: {}) => Client
  start: (opts: {}) => Client
  isStarted: () => Boolean
}

const Bugsnag: Notifier = {
  _client: null,
  createClient: (opts: {}) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    const internalPlugins: Plugin[] = []

    // configure a client with user supplied options
    const bugsnag = new Client(opts as Config, schema, internalPlugins, { name, version, url })

    bugsnag._setDelivery(delivery)

    bugsnag._logger.debug('Loaded!')

    return bugsnag
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

// Add client functions to notifier
Object.getOwnPropertyNames(Client.prototype).forEach(method => {
  // skip private methods
  if (/^_/.test(method) || method === 'constructor') return
  // @ts-ignore:
  Bugsnag[method] = function () {
    if (!Bugsnag._client) return console.log(`Bugsnag.${method}() was called before Bugsnag.start()`)
    Bugsnag._client._depth += 1
    // @ts-ignore:
    const ret = Bugsnag._client[method].apply(Bugsnag._client, arguments)
    Bugsnag._client._depth -= 1
    return ret
  }
})

export default Bugsnag
