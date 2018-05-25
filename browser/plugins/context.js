const getScope = require('../scope')

/*
 * Sets the default context to be the current URL
 */
module.exports = {
  init: (client) => {
    const scope = getScope()
    client.config.beforeSend.unshift(report => {
      if (report.context) return
      report.context = scope.location.pathname
    })
  }
}
