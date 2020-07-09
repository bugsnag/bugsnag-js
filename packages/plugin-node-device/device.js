const os = require('os')

/*
 * Automatically detects Node server details ('device' in the API)
 */
module.exports = {
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
