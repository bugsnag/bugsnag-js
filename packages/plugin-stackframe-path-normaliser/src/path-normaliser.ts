import type { Plugin, Stackframe } from '@bugsnag/core'

const plugin: Plugin = {
  load (client) {
    client.addOnError(event => {
      const allFrames: Stackframe[] = event.errors.reduce((accum: Stackframe[], er) => accum.concat(er.stacktrace), [])

      allFrames.forEach(stackframe => {
        if (typeof stackframe.file !== 'string') {
          return
        }

        stackframe.file = stackframe.file.replace(/\\/g, '/')
      })
    })
  }
}

export default plugin
