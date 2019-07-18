/*
 * Sets the default context to be the current URL
 */
module.exports = {
  init: (client, win = window) => {
    client.config.beforeSend.unshift(report => {
      if (report.get('context')) return
      report.set('context', win.location.pathname)
    })
  }
}
