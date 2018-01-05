/*
 * Sets the default context to be the current URL
 */
module.exports = {
  init: (client) => {
    client.config.beforeSend.unshift(report => {
      if (report.context) return
      report.context = window.location.pathname
    })
  }
}
