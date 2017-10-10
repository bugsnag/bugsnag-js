module.exports = {
  name: 'device',
  description: 'Automatically detects browser device details',
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
