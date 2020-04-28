const { promisify } = require('util')
const { readFile } = require('fs')
const { join } = require('path')

module.exports = async (dir) => {
  try {
    const pkg = JSON.parse(await promisify(readFile)(join(dir, 'package.json'), 'utf8'))
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
    return allDeps['@bugsnag/expo']
  } catch (e) {
    throw new Error('Could not load package.json. Is this the project root?')
  }
}
