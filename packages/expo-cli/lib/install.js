const { spawn } = require('child_process')

module.exports = (packageManager, version, projectRoot) => {
  return new Promise((resolve, reject) => {
    const cmd = commands(version).get(packageManager)
    if (!cmd) return reject(new Error(`Don’t know what command to use for ${packageManager}`))
    const proc = spawn(cmd[0], cmd[1], { cwd: projectRoot })

    // buffer output in case of an error
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', d => { stdout += d })
    proc.stderr.on('data', d => { stderr += d })

    proc.on('error', err => {
      reject(err)
    })

    proc.on('close', code => {
      if (code === 0) return resolve()
      reject(
        new Error(
          `Command exited with non-zero exit code (${code}) "${cmd[0]} ${cmd[1].join(' ')}"\nstdout:\n${stdout}\n\nstderr:\n${stderr}`
        )
      )
    })
  })
}

const commands = version => new Map([
  ['yarn', ['yarn', ['add', `@bugsnag/expo@${version}`]]],
  ['npm', ['npm', ['install', `@bugsnag/expo@${version}`]]]
])
