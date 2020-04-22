const { join } = require('path')
const { readFile, writeFile } = require('fs')
const { promisify } = require('util')
const detectInstalled = require('./detect-installed')
const semver = require('semver')

const importRe = /from ["']@bugsnag\/expo["']/
const requireRe = /require\(["']@bugsnag\/expo["']\)/

module.exports = async (projectRoot) => {
  try {
    const appJsPath = join(projectRoot, 'App.js')
    const appJs = await promisify(readFile)(appJsPath, 'utf8')
    const manifestRange = await detectInstalled(projectRoot)
    const isPostV7 = !manifestRange || semver.satisfies('7.0.0', manifestRange)
    if (importRe.test(appJs) || requireRe.test(appJs)) {
      return '@bugsnag/expo is already imported in App.js'
    }
    await promisify(writeFile)(appJsPath, `${module.exports.code[isPostV7 ? 'postV7' : 'preV7']}\n${appJs}`, 'utf8')
  } catch (e) {
    // swallow and rethrow for errors that we can produce better messaging for
    if (e.code === 'ENOENT') {
      throw new Error(`Couldn’t find App.js in "${projectRoot}". Is this the root of your Expo project?`)
    }
    throw e
  }
}

module.exports.code = {
  preV7: `import bugsnag from '@bugsnag/expo';
const bugsnagClient = bugsnag();
`,
  postV7: `import Bugsnag from '@bugsnag/expo';
Bugsnag.start();
`
}
