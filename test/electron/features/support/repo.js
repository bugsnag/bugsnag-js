const { exec, spawn } = require('child_process')
const { promisify } = require('util')
const { randomBytes } = require('crypto')

const isWindows = process.platform === 'win32'
const npmRunner = isWindows ? 'npm.cmd' : 'npm'
const publishSuffix = isWindows ? '-win32' : ''
const run = promisify(exec)

// Support publish retry to avoid failure on windows caused by intermittent
// ZlibError in `npm pack`
const publish = async (version, retries = 2) => {
  const opts = { env: { ...process.env, VERSION_IDENTIFIER: version } }
  console.log('version log', version);
  return run(`npm run local-npm:publish-all${publishSuffix}`, opts)
    .catch(async (err) => {
      if (retries > 0) {
        return publish(version, retries - 1)
      }
      throw err
    })
}

module.exports = {
  publishPackages: async () => {
    const id = randomBytes(12).toString('hex')
    const buildVersion = `200.1.0-canary.${id}`
    await publish(buildVersion)
    return buildVersion
  },
  startServer: () => {
    const proc = spawn(npmRunner, ['run', 'local-npm:start'])
    proc.stderr.on('data', data => console.log(data.toString()))
    return proc
  }
}
