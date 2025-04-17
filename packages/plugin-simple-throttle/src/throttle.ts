import intRange from '@bugsnag/core/lib/validators/int-range'
import { Client, Config, Plugin } from '@bugsnag/core'

interface PluginConfig extends Config {
  maxEvents: number
}
interface ThrottlePlugin extends Plugin<PluginConfig> {
  configSchema: {
    [key: string]: {
      defaultValue: () => unknown
      message: string
      validate: (value: unknown) => boolean
    }
  }
}

interface InternalClient extends Client<PluginConfig> {
  resetEventCount: () => void
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
    ;
    (client as InternalClient).resetEventCount = () => { n = 0 }
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
