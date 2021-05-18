module.exports = {
  load: client => {
    const projectRoot = client._config.projectRoot

    client.addOnError(event => {
      const allFrames = event.errors.reduce((accum, er) => accum.concat(er.stacktrace), [])
      allFrames.forEach(stackframe => {
        if (typeof stackframe.file !== 'string') return
        stackframe.file = stripProjectRoot(projectRoot, stackframe.file)
      })
    })
  }
}

const stripProjectRoot = module.exports.stripProjectRoot = (projectRoot, path) => {
  // decode URI escaped chars
  let p = decodeURI(path)

  // strip file protocol
  p = p.replace(/^file:\/\//, '')

  // strip extra leading slash on windows
  if (p.match('^/[A-Z]:/')) {
    p = p.slice(1)
  }

  // only continue with the next steps if we have a project root
  if (!projectRoot) return p

  const normalizedRoot = projectRoot ? projectRoot.replace(/\\/g, '/') : null
  if (p.indexOf(projectRoot) === 0) {
    p = p.slice(projectRoot.length)
  } else if (p.indexOf(normalizedRoot) === 0) {
    // normalize path if needed - renderer paths on windows use '/' as a separator
    p = p.slice(normalizedRoot.length)
  }

  return p
}
