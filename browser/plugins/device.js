const { isoDate } = require('../../base/lib/es-utils')
/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client, BugsnagReport) => {
    client.config.beforeSend.push((report) => {
      report.device = {
        ...{
          time: isoDate(),
          locale: navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || navigator.language,
          userAgent: navigator.userAgent
        },
        ...report.device
      }
    })
  }
}
