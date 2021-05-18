let createClient
const isMain = typeof process !== 'undefined' && process.type === 'browser'
if (isMain) {
  createClient = require('./client/main')
} else {
  createClient = require('./client/renderer')
}

const { Client, Event, Breadcrumb, Session } = createClient

const Bugsnag = {
  _client: null,
  start: (opts) => {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.')
      return Bugsnag._client
    }

    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = { apiKey: opts }
    if (!opts) opts = {}

    // create the relevant client for the detected environment
    Bugsnag._client = createClient(opts)

    return Bugsnag._client
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

// commonjs
module.exports = Bugsnag

module.exports.Client = Client
module.exports.Event = Event
module.exports.Breadcrumb = Breadcrumb
module.exports.Session = Session

// ESM
module.exports.default = Bugsnag
