module.exports = {
  load: client => {
    const projectRoot = client._config.projectRoot
    const normalizedRoot = projectRoot ? projectRoot.replace(/\\/g, '/') : null

    client.addOnError(event => {
      const allFrames = event.errors.reduce((accum, er) => accum.concat(er.stacktrace), [])
      allFrames.forEach(stackframe => {
        if (typeof stackframe.file !== 'string') return
        stackframe.file = stackframe.file.replace(/^file:\/\//, '')
        if (stackframe.file.match('^/[A-Z]:/')) {
          stackframe.file = stackframe.file.slice(1) // strip extra leading slash on windows
        }
        if (!projectRoot) return
        if (stackframe.file.indexOf(projectRoot) === 0) {
          stackframe.file = stackframe.file.slice(projectRoot.length)
        } else if (stackframe.file.indexOf(normalizedRoot) === 0) {
          // normalize path if needed - renderer paths on windows use '/' as a separator
          stackframe.file = stackframe.file.slice(normalizedRoot.length)
        }
      })
    })
  }
}
