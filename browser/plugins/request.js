/*
 * Sets the report request: { url } to be the current href
 */
module.exports = {
  init: (client) => {
    client.config.beforeSend.unshift(report => {
      if (report.request && report.request.url) return
      report.request = { ...report.request, url: window.location.href }
    })
  }
}
