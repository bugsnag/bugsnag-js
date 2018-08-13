const { isoDate } = require('@bugsnag/core/lib/es-utils')

/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client, nav = navigator) => {
    const device = {
      locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
      userAgent: nav.userAgent
    }

    // merge with anything already set on the client
    client.device = { ...device, ...client.device }

    // add time just as the report is sent
    client.config.beforeSend.unshift((report) => {
      report.device = { ...report.device, time: isoDate() }
    })
  }
}
