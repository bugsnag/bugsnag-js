/*
 * Remove query strings (and fragments) from stacktraces
 */
import { Plugin, Stackframe } from '@bugsnag/core'
import map from '@bugsnag/core/lib/es-utils/map'
import reduce from '@bugsnag/core/lib/es-utils/reduce'

const strip = (str: any) =>
  typeof str === 'string'
    ? str.replace(/\?.*$/, '').replace(/#.*$/, '')
    : str

interface ExtendedPlugin extends Plugin {
  _strip: typeof strip
}

const plugin: ExtendedPlugin = {
  load: (client) => {
    client.addOnError(event => {
      const allFrames: Stackframe[] = reduce(event.errors, (accum, er) => accum.concat(er.stacktrace), [])
      map(allFrames, frame => {
        frame.file = strip(frame.file)
      })
    })
  },
  _strip: strip
}

export default plugin
