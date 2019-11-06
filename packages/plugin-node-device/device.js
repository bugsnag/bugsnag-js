const { isoDate } = require('@bugsnag/core/lib/es-utils')

/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client) => {
    const device = {
      hostname: client._config.hostname,
      runtimeVersions: { node: process.versions.node }
    }

    client.addOnError(event => {
      event.device = { ...event.device, ...device, time: isoDate() }
    }, true)

    client._addOnSessionPayload(sessionPayload => {
      sessionPayload.device = { ...sessionPayload.device, hostname: device.hostname, runtimeVersions: device.runtimeVersions }
    }, true)
  }
}
