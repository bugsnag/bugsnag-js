/*
 * Sets the default context to be the current URL
 */
module.exports = {
  init: (client, win = window) => {
    client.addOnError(event => {
      if (event.context !== undefined) return
      event.context = win.location.pathname
    }, true)
  }
}
