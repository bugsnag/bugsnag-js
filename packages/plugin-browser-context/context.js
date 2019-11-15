/*
 * Sets the default context to be the current URL
 */
module.exports = {
  init: (client, win = window) => {
    client.config.beforeSend.unshift(event => {
      if (event.context) return
      event.context = win.location.pathname
    })
  }
}
