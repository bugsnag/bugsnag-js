import { Plugin } from '@bugsnag/core'
/*
 * Sets the default context to be the current URL
 */
export default (win = window): Plugin => ({
  load: client => {
    client.addOnError(event => {
      if (event.context !== undefined) return
      event.context = win.location.pathname
      // @ts-expect-error second parameter is private API
    }, true)
  }
})
