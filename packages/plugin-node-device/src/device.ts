import { Config, Plugin } from '@bugsnag/core'
import os from 'os'

export interface PluginConfig extends Config {
  hostname: string
}

/*
 * Automatically detects Node server details ('device' in the API)
 */
const plugin: Plugin<PluginConfig> = {
  load: (client) => {
    const device = {
      osName: `${os.platform()} (${os.arch()})`,
      osVersion: os.release(),
      totalMemory: os.totalmem(),
      hostname: client._config.hostname,
      runtimeVersions: { node: process.versions.node }
    }

    client._addOnSessionPayload(sp => {
      sp.device = {
        ...sp.device,
        ...device
      }
    })

    // add time just as the event is sent
    client.addOnError((event) => {
      event.device = {
        ...event.device,
        ...device,
        freeMemory: os.freemem(),
        time: new Date()
      }
    }, true)
  }
}

export default plugin 