const { intRange } = require('@bugsnag/core/lib/validators')

/*
 * Throttles and dedupes error reports
 */

module.exports = {
  init: (client) => {
    // track sent events for each init of the plugin
    let n = 0

    // add beforeSend hook
    client.config.beforeSend.push((report) => {
      // have max events been sent already?
      if (n >= client.config.maxEvents) return report.ignore()
      n++
    })

    client.refresh = () => { n = 0 }
  },
  configSchema: {
    maxEvents: {
      defaultValue: () => 10,
      message: 'should be a positive integer ≤100',
      validate: val => intRange(1, 100)(val)
    }
  }
}
