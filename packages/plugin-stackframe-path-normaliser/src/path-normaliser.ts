import type { Plugin, Stackframe } from '@bugsnag/core'

const WINDOWS_SEPARATOR_REGEX = /\\/g

const plugin: Plugin = {
  load: (client): void => {
    client.addOnError((event) => {
      const allFrames: Stackframe[] = event.errors.reduce(
        (accum: Stackframe[], error) => accum.concat(error.stacktrace),
        []
      )

      allFrames.forEach((stackframe: Stackframe) => {
        if (typeof stackframe.file !== 'string') return
        stackframe.file = stackframe.file.replace(WINDOWS_SEPARATOR_REGEX, '/')
      })
    })
  }
}

export default plugin