const { join } = require('path')
const { spawn } = require('child_process')

const defaultFixturePath = join(__dirname, '../../fixtures/app')

const npmRunner = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const installArgs = ['install', '--progress=false', '--no-audit', '--no-optional', '--no-save']
const log = (msg, ...args) => console.log(`  [TestApp] ${msg}`, ...args)

class TestApp {
  constructor (pathToFixture = defaultFixturePath) {
    this.buildDir = pathToFixture
    this.appName = require(join(pathToFixture, 'package.json')).name
  }

  async packageApp (env) {
    await this._exec(npmRunner, ['run', 'package'], env)
  }

  async installDeps (bugsnagVersion, electronVersion = '^11.4.0') {
    // install this first. electron has a lengthy postinstall script, and doing
    // a bare `npm install` first will wildcard to the latest / last version
    // installed, doubling the install time
    await this._exec(npmRunner, [...installArgs, `electron@${electronVersion}`])
    await this._exec(npmRunner, [...installArgs], {}, 100)
    await this._exec(npmRunner, [...installArgs, '--registry', 'http://0.0.0.0:5539', `@bugsnag/electron@${bugsnagVersion}`])
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

  async _exec (command, args = [], env = {}, timeout = 60, retries = 1) {
    log(`exec: ${command} ${args.join(' ')}`)
    let proc
    return Promise.race([
      new Promise((resolve, reject) => setTimeout(() => {
        if (proc) {
          proc.kill()
        }
        reject(new Error(`Command timed out (${timeout}s)`))
      }, timeout * 1000)),
      new Promise((resolve, reject) => {
        proc = spawn(command, args, { cwd: this.buildDir, env: { ...process.env, ...env } })
        // handy for debugging but otherwise annoying output
        if (process.env.VERBOSE) {
          proc.stderr.on('data', data => { process.stdout.write(data) })
        } else {
          // webpack will hang if *something* doesn't read from stderr, even when
          // everything is fine
          proc.stderr.on('data', () => {})
        }
        proc.stdout.on('data', () => {})
        proc.on('close', async (code) => {
          if (code !== 0) {
            reject(new Error(`Running '${command}' failed with code: ${code}`))
          } else {
            resolve()
          }
        })
      })
    ]).catch(async (err) => {
      if (retries > 0) {
        log(`retrying ${command} command - ${err}`)
        return await this._exec(command, args, env, timeout, retries - 1)
      } else {
        throw err
      }
    })
  }
}

module.exports = { TestApp }
