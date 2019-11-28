/*
 * Sets the event request: { url } to be the current href
 */
module.exports = {
  init: (client, win = window) => {
    client._config.onError.unshift(event => {
      if (event.request && event.request.url) return
      event.request = { ...event.request, url: win.location.href }
    })
  }
}
