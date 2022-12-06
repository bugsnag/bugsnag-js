
import Client from '@bugsnag/core/client'
import { schema as coreSchema } from '@bugsnag/core/config'
import delivery from '@bugsnag/delivery-fetch'
import config from './config'
import preventDiscard from './prevent-discard'

const name = 'Bugsnag JavaScript'
const url = 'https://github.com/bugsnag/bugsnag-js'
const version = __VERSION__ // eslint-disable-line no-undef

// extend the base config schema with some worker-specific options
const schema = { ...coreSchema, ...config }

export const Bugsnag = {
  createClient: (opts) => {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    const internalPlugins = [preventDiscard]

    // configure a client with user supplied options
    const bugsnag = new Client(opts, schema, internalPlugins, { name, version, url })

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
