const { isoDate } = require('@bugsnag/core/lib/es-utils')

/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client) => {
    const device = { hostname: client.config.hostname }

    // merge with anything already set on the client
    client.device = { ...device, ...client.device }

    // add time just as the report is sent
    client.config.beforeSend.unshift((report) => {
      report.device = { ...report.device, time: isoDate() }
      report.updateMetaData('device', { runtimeVersions: process.versions })
    })
  }
}
