const { _electron: electron } = require('playwright')

const log = process.env.VERBOSE
  ? (msg, ...args) => console.log(`[Automator] ${msg}`, ...args)
  : () => {}

class Automator {
  constructor (app) {
    this.app = app
    this.crashed = false
  }

  async start (env = {}) {
    this.crashed = false
    this.runner = await this._launchApp(env)
    this.window = await this._getFirstWindow(env)

    // pipe app logs into the console
    this.window.on('console', console.log)
  }

  async stop () {
    if (!this.crashed) {
      try {
        await this.runner.close()
      } catch (e) {
      }
    }
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
    return Promise.race([
      new Promise((resolve, reject) => setTimeout(() => {
        reject(new Error(`launch timed out (${timeout}s)`))
      }, timeout * 1000)),
      electron.launch({
        args: this.app.launchArgs(),
        executablePath: this.app.packagedPath(),
        env: { ...process.env, ...env }
      })
    ]).catch(async (err) => {
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
