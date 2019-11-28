const { map } = require('@bugsnag/core/lib/es-utils')
const normalizePath = require('@bugsnag/core/lib/path-normalizer')

module.exports = {
  init: client => client._config.onError.push(event => {
    if (!client._config.projectRoot) return
    const projectRoot = normalizePath(client._config.projectRoot)
    event.stacktrace = map(event.stacktrace, stackframe => {
      if (typeof stackframe.file === 'string' && stackframe.file.indexOf(projectRoot) === 0) {
        stackframe.file = stackframe.file.replace(projectRoot, '')
      }
      return stackframe
    })
  })
}
