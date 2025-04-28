import { Plugin } from '@bugsnag/core'
import assign from '@bugsnag/core/lib/es-utils/assign'

/*
 * Sets the event request: { url } to be the current href
 */
export default (win = window): Plugin => ({
  load: (client) => {
    client.addOnError(event => {
      if (event.request && event.request.url) return
      event.request = assign({}, event.request, { url: win.location.href })
    }, true)
  }
})
