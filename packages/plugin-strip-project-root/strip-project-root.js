const { map, reduce } = require('@bugsnag/core/lib/es-utils')
const normalizePath = require('@bugsnag/core/lib/path-normalizer')

module.exports = {
  init: client => {
    if (!client._config.projectRoot) return
    client.addOnError(event => {
      const projectRoot = normalizePath(client._config.projectRoot)
      const allFrames = reduce(event.errors, (accum, er) => accum.concat(er.stacktrace), [])
      map(allFrames, stackframe => {
        if (typeof stackframe.file === 'string' && stackframe.file.indexOf(projectRoot) === 0) {
          stackframe.file = stackframe.file.replace(projectRoot, '')
        }
      })
    }, true)
  }
}
