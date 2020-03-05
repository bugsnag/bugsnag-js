/*
 * Sets the default context to be the current URL
 */
module.exports = (win = window) => ({
  load: (client) => {
    client.addOnError(event => {
      if (event.context !== undefined) return
      event.context = win.location.pathname
    }, true)
  }
})
