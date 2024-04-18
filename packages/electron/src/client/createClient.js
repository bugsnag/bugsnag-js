const Client = require('@bugsnag/core/client')

const createClient = (createProcessClient, process) => {
  const Bugsnag = {
    _client: null,
    lastRunInfo: null,
    start: (opts) => {
      if (Bugsnag._client) {
        Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
        return Bugsnag._client
      }

      // handle very simple use case where user supplies just the api key as a string
      if (typeof opts === 'string') opts = { apiKey: opts }
      if (!opts) opts = {}

      // create the relevant client for the provided process
      Bugsnag._client = createProcessClient(opts)

      Object.defineProperty(Bugsnag, 'lastRunInfo', {
        get: process === 'main'
          ? () => Bugsnag._client.lastRunInfo
          : () => {
            Bugsnag._client._logger.warn('Bugsnag.lastRunInfo can only be accessed in the main process')
            return null
          }
      })

      return Bugsnag._client
    },
    isStarted: () => {
      return Bugsnag._client != null
    }
  }

  // Forward on all Bugsnag.* facade method calls to the underlying client
  const methods = Object.getOwnPropertyNames(Client.prototype).concat(['markLaunchComplete'])

  methods.forEach((m) => {
    if (/^_/.test(m)) return
    Bugsnag[m] = function () {
      if (!Bugsnag._client) return console.error(`Bugsnag.${m}() was called before Bugsnag.start()`)
      Bugsnag._client._depth += 1
      const ret = Bugsnag._client[m].apply(Bugsnag._client, arguments)
      Bugsnag._client._depth -= 1
      return ret
    }
  })

  return Bugsnag
}

module.exports = createClient
