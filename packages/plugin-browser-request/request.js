/*
 * Sets the event request: { url } to be the current href
 */
module.exports = {
  init: (client, win = window) => {
    client.config.beforeSend.unshift(event => {
      if (event.request && event.request.url) return
      event.request = { ...event.request, url: win.location.href }
    })
  }
}
