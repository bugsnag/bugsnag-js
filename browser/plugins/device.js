/*
 * Automatically detects browser device details
 */

module.exports = {
  init: (client, BugsnagReport) => {
    client.config.beforeSend.push((report) => {
      report.device = {
        ...{
          time: (new Date()).toISOString(),
          locale: navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || navigator.language,
          userAgent: navigator.userAgent
        },
        ...report.device
      }
    })
  }
}
