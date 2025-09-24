import { Plugin } from '@bugsnag/core'


/*
 * Sets the event request: { url } to be the current href
 */
export default (win = window): Plugin => ({
  load: (client) => {
    client.addOnError(event => {
      if (event.request && event.request.url) return
      event.request = Object.assign({}, event.request, { url: win.location.href })
    }, true)
  }
})
