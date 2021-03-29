const { _electron: electron } = require('playwright')
const psList = require('ps-list')

const log = process.env.VERBOSE
  ? (msg, ...args) => console.log(`[Automator] ${msg}`, ...args)
  : () => {}

// returns true if a process' name or cmd does not contain a value
const procNotMatching = (p, value) => p.name.indexOf(value) === -1 && (!p.cmd || p.cmd.indexOf(value) === -1)

class Automator {
  constructor (app) {
    this.app = app
    this.crashed = false
  }

  async start (env = {}) {
    this.crashed = false
    this.runner = await this._launchApp(env)
    this.runner.context().setDefaultTimeout(10_000)
    this.window = await this._getFirstWindow(env)

    // pipe app logs into the console
    this.window.on('console', console.log)
  }

  async stop () {
    return Promise.race([
      new Promise((resolve, reject) => setTimeout(() => {
        reject(new Error('closing app timed out (5s)'))
      }, 5_000)),
      this.runner.close()
    ]).catch(async () => {
      const list = await psList()
      list
        .filter(p => p.ppid === process.pid && procNotMatching(p, 'npm'))
        .forEach(p => {
          try {
            process.kill(p.pid)
          } catch (e) {
          }
        })
    })
  }

  async click (elementID) {
    if (this.crashed) {
      throw new Error('app is no longer running')
    }
    try {
      await this.window.click(`id=${elementID}`)
    } catch (e) {
      if (e.toString().indexOf('Browser closed') >= 0) {
        this.crashed = true
      } else {
        throw e
      }
    }
  }

  async _getFirstWindow (env = {}, retries = 2, timeout = 5) {
    return Promise.race([
      new Promise((resolve, reject) => setTimeout(() => {
        reject(new Error(`window load timed out (${timeout}s)`))
      }, timeout * 1000)),
      this.runner.firstWindow()
    ]).catch(async (err) => {
      if (retries > 0) {
        log(`first window did not load, retrying app launch - ${err}`)
        await this.stop()
        return await this.start(env, retries - 1)
      } else {
        throw err
      }
    })
  }

  // Launch the test app with potential retries, as there may be difficulty
  // connecting
  //
  // Playwright debugging tools, for when the launch process is too opaque:
  // https://playwright.dev/docs/debug
  async _launchApp (env, retries = 2, timeout = 5) {
    return electron.launch({
      args: this.app.launchArgs(),
      executablePath: this.app.packagedPath(),
      env: { ...process.env, ...env },
      timeout: timeout * 1000
    }).catch(async (err) => {
      if (retries > 0) {
        log(`launch failed, retrying - ${err}`)
        return await this._launchApp(env, retries - 1, timeout)
      } else {
        throw err
      }
    })
  }
}

module.exports = { Automator }
