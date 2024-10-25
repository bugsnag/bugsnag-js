import { Plugin } from '@bugsnag/core'
import intRange from '@bugsnag/core/lib/validators/int-range'
/*
 * Throttles and dedupes events
 */

const plugin: Plugin = {
  load: (client) => {
    // track sent events for each init of the plugin
    let n = 0

    // add onError hook
    client.addOnError((event) => {
      // have max events been sent already?
      // @ts-expect-error _config is private API
      if (n >= client._config.maxEvents) {
        // @ts-expect-error _config is private API
        client._logger.warn(`Cancelling event send due to maxEvents per session limit of ${client._config.maxEvents} being reached`)
        return false
      }
      n++
    })

    client.resetEventCount = () => { n = 0 }
  },
  // @ts-expect-error _config is private API
  configSchema: {
    maxEvents: {
      defaultValue: () => 10,
      message: 'should be a positive integer ≤100',
      validate: (val: unknown): val is number => intRange(1, 100)(val)
    }
  }
}

export default plugin
