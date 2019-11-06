const { join } = require('path')
const { readFile, writeFile } = require('fs')
const { promisify } = require('util')

const importRe = /from ["']@bugsnag\/expo["']/
const requireRe = /require\(["']@bugsnag\/expo["']\)/

module.exports = async (projectRoot) => {
  try {
    const appJsPath = join(projectRoot, 'App.js')
    const appJs = await promisify(readFile)(appJsPath, 'utf8')
    if (importRe.test(appJs) || requireRe.test(appJs)) {
      return '@bugsnag/expo is already imported in App.js'
    }
    await promisify(writeFile)(appJsPath, `${module.exports.code}\n${appJs}`, 'utf8')
  } catch (e) {
    // swallow and rethrow for errors that we can produce better messaging for
    if (e.code === 'ENOENT') {
      throw new Error(`Couldn’t find App.js in "${projectRoot}". Is this the root of your Expo project?`)
    }
    throw e
  }
}

module.exports.code =
`import Bugsnag from '@bugsnag/expo';
Bugsnag.init();
`
