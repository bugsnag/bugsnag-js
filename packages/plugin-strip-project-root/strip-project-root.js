const { map, reduce } = require('@bugsnag/core/lib/es-utils')
const normalizePath = require('@bugsnag/core/lib/path-normalizer')

module.exports = {
  init: client => client.addOnError(event => {
    if (!client._config.projectRoot) return
    const projectRoot = normalizePath(client._config.projectRoot)
    const allFrames = reduce(event.errors, (accum, er) => accum.concat(er.stacktrace), [])
    map(allFrames, stackframe => {
      if (typeof stackframe.file === 'string' && stackframe.file.indexOf(projectRoot) === 0) {
        stackframe.file = stackframe.file.replace(projectRoot, '')
      }
    })
  })
}
