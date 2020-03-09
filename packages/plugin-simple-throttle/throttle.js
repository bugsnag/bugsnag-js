const intRange = require('@bugsnag/core/lib/validators/int-range')

/*
 * Throttles and dedupes events
 */

module.exports = {
  load: (client) => {
    // track sent events for each init of the plugin
    let n = 0

    // add onError hook
    client.addOnError((event) => {
      // have max events been sent already?
      if (n >= client._config.maxEvents) return false
      n++
    })

    client.resetEventCount = () => { n = 0 }
  },
  configSchema: {
    maxEvents: {
      defaultValue: () => 10,
      message: 'should be a positive integer ≤100',
      validate: val => intRange(1, 100)(val)
    }
  }
}
