const { join } = require('path')
const { spawn } = require('child_process')

const defaultFixturePath = join(__dirname, '../../fixtures/app')

const npmRunner = process.platform === 'win32' ? 'npm.cmd' : 'npm'

class TestApp {
  constructor (pathToFixture = defaultFixturePath) {
    this.buildDir = pathToFixture
    this.appName = require(join(pathToFixture, 'package.json')).name
  }

  async installDeps () {
    // retry install commands to avoid intermittent failure in electron-rebuild
    await this._exec(npmRunner, ['install'], 1)
  }

  async packageApp (env) {
    await this._exec(npmRunner, ['run', 'package'], 0, env)
  }

  async installBugsnag (version) {
    // can't avoid altering the test app's package.json? :(
    // https://github.com/npm/npm/issues/17927
    await this._exec(npmRunner, ['install', `@bugsnag/electron@${version}`, '--registry', 'http://0.0.0.0:5539'], 1)
  }

  packagedPath () {
    const platform = process.platform
    const name = this.appName
    const base = join(this.buildDir, 'out', `${name}-${platform}-${process.arch}`)
    switch (platform) {
      case 'darwin':
        return join(base, `${name}.app/Contents/MacOS/${name}`)
      case 'linux':
        return join(base, name)
      case 'win32':
        return join(base, `${name}.exe`)

      default:
        throw new Error(`No packaged app path configured for ${platform}`)
    }
  }

  launchArgs () {
    switch (process.platform) {
      case 'linux':
        // required for running chromium and friends in a root-y environment
        return ['--no-sandbox']

      default:
        return []
    }
  }

  async _exec (command, args = [], retries = 0, env = {}) {
    await new Promise((resolve, reject) => {
      const proc = spawn(command, args, { cwd: this.buildDir, env: { ...process.env, ...env } })
      // handy for debugging but otherwise annoying output
      if (process.env.VERBOSE) {
        proc.stderr.on('data', data => { console.log(`  stderr: ${data}`) })
      } else {
        // webpack will hang if *something* doesn't read from stderr, even when
        // everything is fine
        proc.stderr.on('data', () => {})
      }
      proc.on('close', async (code) => {
        if (code !== 0) {
          if (retries > 0) {
            await this._exec(command, args, retries - 1)
            resolve()
          } else {
            reject(new Error(`Running '${command}' failed with code: ${code}`))
          }
        } else {
          resolve()
        }
      })
    })
  }
}

module.exports = { TestApp }
