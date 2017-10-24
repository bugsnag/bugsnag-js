/*
 * Automatically detects browser device details
 */

module.exports = {
  name: 'device',
  init: (client, BugsnagReport) => {
    client.config.beforeSend.push((report) => {
      report.device = Object.assign({
        time: (new Date()).toISOString(),
        locale: navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || navigator.language,
        userAgent: navigator.userAgent
      }, report.device)
    })
  }
}
