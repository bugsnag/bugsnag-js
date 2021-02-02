const { join } = require('path')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const defaultFixturePath = join(__dirname, '../../fixtures/app')

class TestApp {
  constructor (pathToFixture = defaultFixturePath) {
    this.buildDir = pathToFixture
    this.appName = require(join(pathToFixture, 'package.json')).name
  }

  async packageApp () {
    await exec('npm install', { cwd: this.buildDir })
    await exec('npm run package', { cwd: this.buildDir })
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
}

module.exports = { TestApp }
