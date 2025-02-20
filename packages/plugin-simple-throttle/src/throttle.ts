import intRange from '@bugsnag/core/lib/validators/int-range'
import { Client, Config, Logger, Plugin } from '@bugsnag/core'

interface ThrottlePlugin extends Plugin {
  configSchema: {
    [key: string]: {
      defaultValue: () => unknown
      message: string
      validate: (value: unknown) => boolean
    }
  }
}

interface InternalClient extends Client {
  _config: Config & { maxEvents: number }
  _logger: Logger
}

/*
 * Throttles and dedupes events
 */

const plugin: ThrottlePlugin = {
  load: (client) => {
    // track sent events for each init of the plugin
    let n = 0

    // add onError hook
    client.addOnError((event) => {
      // have max events been sent already?
      if (n >= (client as InternalClient)._config.maxEvents) {
        (client as InternalClient)._logger.warn(`Cancelling event send due to maxEvents per session limit of ${(client as InternalClient)._config.maxEvents} being reached`)
        return false
      }
      n++
    })

    client.resetEventCount = () => { n = 0 }
  },
  configSchema: {
    maxEvents: {
      defaultValue: () => 10,
      message: 'should be a positive integer ≤100',
      validate: (val: unknown): val is number => intRange(1, 100)(val)
    }
  }
}

export default plugin
