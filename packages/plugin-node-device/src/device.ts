import { Plugin } from '@bugsnag/core'
import os from 'os'

/*
 * Automatically detects Node server details ('device' in the API)
 */
const plugin: Plugin = {
  load: (client) => {
    const device = {
      osName: `${os.platform()} (${os.arch()})`,
      osVersion: os.release(),
      totalMemory: os.totalmem(),
      // @ts-expect-error _config is private API
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