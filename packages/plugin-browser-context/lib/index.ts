import { Client } from '@bugsnag/core'

/*
 * Sets the default context to be the current URL
 */
const plugin = (win = window) => ({
  load: (client: Client) => {
    client.addOnError(event => {
      if (event.context !== undefined) return
      event.context = win.location.pathname
      // @ts-expect-error front parameter (true) missing from public types
    }, true)
  }
})

module.exports = plugin

export default plugin
