const { normalizePath } = require('@bugsnag/core')

module.exports = {
  load: client => client.addOnError(event => {
    if (!client._config.projectRoot) return
    const projectRoot = normalizePath(client._config.projectRoot)
    const allFrames = event.errors.reduce((accum, er) => accum.concat(er.stacktrace), [])
    allFrames.map(stackframe => {
      stackframe.inProject = typeof stackframe.file === 'string' &&
        stackframe.file.indexOf(projectRoot) === 0 &&
        !/\/node_modules\//.test(stackframe.file)
    })
  })
}
