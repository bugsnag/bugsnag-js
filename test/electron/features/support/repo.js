const { exec, spawn } = require('child_process')
const { promisify } = require('util')
const { randomBytes } = require('crypto')
const { join } = require('path')
const { readFile, writeFile } = require('fs').promises

const isWindows = process.platform === 'win32'
const npmRunner = isWindows ? 'npm.cmd' : 'npm'
const publishSuffix = isWindows ? '-win32' : ''
const run = promisify(exec)

// Support publish retry to avoid failure on windows caused by intermittent
// ZlibError in `npm pack`
const publish = async (version, retries = 2) => {
  const opts = { env: { ...process.env, VERSION_IDENTIFIER: version } }
  return run(`npm run local-npm:publish-all${publishSuffix}`, opts)
    .catch(async (err) => {
      if (retries > 0) {
        return publish(version, retries - 1)
      }
      throw err
    })
}

const setElectronNativeTestUtilsPublic = async () => {
  const packageFile = join('packages', 'electron-native-test-helpers', 'package.json')
  const packageJson = JSON.parse(await readFile(packageFile, 'utf8'))
  packageJson.private = false
  packageJson.publishConfig = {
    access: 'public'
  }

  await writeFile(packageFile, JSON.stringify(packageJson, null, 2), 'utf8')
}

module.exports = {
  publishPackages: async () => {
    await setElectronNativeTestUtilsPublic()
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
