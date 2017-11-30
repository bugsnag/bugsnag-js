/*
 * Sets the default context to be the current URL
 */
module.exports = {
  init: (client) => {
    client.config.beforeSend.push(report => {
      if (report.context) return
      report.context = window.location.pathname
    })
  }
}
