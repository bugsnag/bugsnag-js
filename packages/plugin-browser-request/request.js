/*
 * Sets the report request: { url } to be the current href
 */
module.exports = {
  init: (client, win = window) => {
    client.config.beforeSend.unshift(report => {
      const req = report.get('request')
      if (req && req.url) return
      report.set('request', 'url', win.location.href)
    })
  }
}
