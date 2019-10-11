/*
 * Sets the report request: { url } to be the current href
 */
module.exports = {
  init: (client, win = window) => {
    client.config.beforeSend.unshift(report => {
      if (report.request && report.request.url) return
      report.request = { ...report.request, url: win.location.href }
    })
  }
}
