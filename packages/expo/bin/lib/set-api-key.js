const { join } = require('path')
const { readFile, writeFile } = require('fs')
const { promisify } = require('util')

module.exports = async (apiKey, projectRoot) => {
  try {
    const appJsonPath = join(projectRoot, 'app.json')
    const conf = JSON.parse(await promisify(readFile)(appJsonPath, 'utf8'))
    conf.expo.extra = conf.expo.extra || {}
    conf.expo.extra.bugsnag = conf.expo.extra.bugsnag || {}
    conf.expo.extra.bugsnag.apiKey = apiKey
    await promisify(writeFile)(appJsonPath, JSON.stringify(conf, null, 2), 'utf8')
  } catch (e) {
    // swallow and rethrow for errors that we can produce better messaging for
    if (e.code === 'ENOENT') {
      throw new Error(`Couldn’t find app.json in "${projectRoot}". Is this the root of your Expo project?`)
    }
    if (e.name === 'SyntaxError') {
      throw new Error(`Couldn’t parse app.json because it wasn’t valid JSON: "${e.message}"`)
    }
    throw e
  }
}
