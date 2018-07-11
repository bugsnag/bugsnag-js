const { isoDate } = require('@bugsnag/core/lib/es-utils')

/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client, nav = navigator) => {
    client.config.beforeSend.unshift((report) => {
      report.device = {
        ...{
          time: isoDate(),
          locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
          userAgent: nav.userAgent
        },
        ...report.device
      }
    })

    client.beforeSession.push(session => { session.device = { userAgent: nav.userAgent } })
  }
}
