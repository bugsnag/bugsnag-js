const { exec, spawn } = require('child_process')
const { promisify } = require('util')
const { randomBytes } = require('crypto')

const isWindows = process.platform === 'win32'
const npmRunner = isWindows ? 'npm.cmd' : 'npm'
const publishSuffix = isWindows ? '-win32' : ''

module.exports = {
  publishPackages: async () => {
    const run = promisify(exec)
    const id = randomBytes(12).toString('hex')
    const buildVersion = `200.1.0-canary.${id}`
    await run(`npm run local-npm:publish-all${publishSuffix}`,
      { env: { ...process.env, VERSION_IDENTIFIER: buildVersion } })
    return buildVersion
  },
  startServer: () => {
    const proc = spawn(npmRunner, ['run', 'local-npm:start'])
    proc.stderr.on('data', data => console.log(data.toString()))
    return proc
  }
}
