const assign = require('@bugsnag/core/lib/es-utils/assign')

/*
 * Sets the event request: { url } to be the current href
 */
module.exports = {
  init: (client, win = window) => {
    client.addOnError(event => {
      if (event.request && event.request.url) return
      event.request = assign({}, event.request, { url: win.location.href })
    }, true)
  }
}
