const { _electron: electron } = require('playwright')

class Automator {
  constructor (app, env) {
    this.app = app
    this.env = env
    this.crashed = false
  }

  async start (env = {}) {
    this.crashed = false
    this.runner = await this._launchApp(env)
    this.window = await this.runner.firstWindow()

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

  // Launch the test app with potential retries, as there may be difficulty
  // connecting
  //
  // Playwright debugging tools, for when the launch process is too opaque:
  // https://playwright.dev/docs/debug
  async _launchApp (env, retries = 2) {
    try {
      return await electron.launch({
        args: this.app.launchArgs(),
        executablePath: this.app.packagedPath(),
        env: { ...process.env, ...this.env, ...env }
      })
    } catch (e) {
      if (retries > 0) {
        return await this._launchApp(env, retries - 1)
      } else {
        throw e
      }
    }
  }
}

module.exports = { Automator }
