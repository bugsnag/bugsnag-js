const { isoDate } = require('../../base/lib/es-utils')
/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client) => {
    client.config.beforeSend.unshift((report) => {
      report.device = {
        ...{
          time: isoDate(),
          locale: navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || navigator.language,
          userAgent: navigator.userAgent
        },
        ...report.device
      }
    })

    client.beforeSession.push(session => { session.device = { userAgent: navigator.userAgent } })
  }
}
