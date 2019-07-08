/*
 * Sets the default context to be the current URL
 */
module.exports = {
  init: (client, win = window) => {
    client.config.beforeSend.unshift(report => {
      console.log('report context', report.get('context'))
      if (report.get('context')) return
      report.set('context', win.location.pathname)
    })
  }
}
