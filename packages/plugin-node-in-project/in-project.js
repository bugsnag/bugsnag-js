const { map } = require('@bugsnag/core/lib/es-utils')
const normalizePath = require('@bugsnag/core/lib/path-normalizer')

module.exports = {
  init: client => client.config.onError.push(event => {
    if (!client.config.projectRoot) return
    const projectRoot = normalizePath(client.config.projectRoot)
    event.stacktrace = map(event.stacktrace, stackframe => {
      stackframe.inProject = typeof stackframe.file === 'string' &&
        stackframe.file.indexOf(projectRoot) === 0 &&
        !/\/node_modules\//.test(stackframe.file)
      return stackframe
    })
  })
}
