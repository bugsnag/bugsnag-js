/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client) => {
    const device = {
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
      event.device = { ...event.device, ...device, time: new Date() }
    }, true)
  }
}
