const prompts = require('prompts')
const { promisify } = require('util')
const { readFile } = require('fs')
const { join } = require('path')
const install = require('../lib/install')
const { onCancel } = require('../lib/utils')
const { blue } = require('kleur')
const semver = require('semver')

module.exports = async (argv, globalOpts) => {
  const projectRoot = globalOpts['project-root']
  const alreadyInstalled = await checkManifest(projectRoot)
  const isWanted = await confirmWanted(alreadyInstalled, projectRoot)
  if (isWanted) {
    const version = await selectVersion(projectRoot)
    const tool = await withTool(projectRoot)
    console.log(blue(`> Installing @bugsnag/expo with ${tool}. This could take a while!`))
    await install(tool, version, projectRoot)
  }
}

const confirmWanted = async (alreadyInstalled, root) => {
  return (await prompts({
    type: 'confirm',
    name: 'install',
    message: alreadyInstalled
      ? '@bugsnag/expo already appears to be installed, do you want to install it anyway?'
      : '@bugsnag/expo does not appear to be installed, do you want to install it?',
    initial: !alreadyInstalled
  }, { onCancel })).install
}

const withTool = async (root) => {
  const cli = await npmOrYarn(root)
  return (await prompts({
    type: 'select',
    name: 'tool',
    message: 'Using yarn or npm?',
    choices: [
      { title: 'npm', value: 'npm' },
      { title: 'yarn', value: 'yarn' }
    ],
    initial: cli === 'npm' ? 0 : 1
  }, { onCancel })).tool
}

const keys = maybeObj => {
  try {
    return Object.keys(maybeObj)
  } catch (e) {
    return []
  }
}

const checkManifest = async (dir) => {
  try {
    const pkg = JSON.parse(await promisify(readFile)(join(dir, 'package.json'), 'utf8'))
    const allDeps = []
      .concat(keys(pkg.dependencies))
      .concat(keys(pkg.devDependencies))
      .concat(keys(pkg.peerDependencies))
    return allDeps.includes('@bugsnag/expo')
  } catch (e) {
    throw new Error('Could not load package.json. Is this the project root?')
  }
}

const selectVersion = async (dir) => {
  try {
    const pkg = JSON.parse(await promisify(readFile)(join(dir, 'package.json'), 'utf8'))
    const expoVersion = pkg.dependencies.expo
    const isPre33 = (expoVersion && !semver.gte(semver.minVersion(expoVersion), '33.0.0'))
    const { version } = await prompts({
      type: 'text',
      name: 'version',
      message: isPre33
        ? 'It looks like you’re using a version of Expo SDK <33. The latest version of Bugsnag works with SDK >= 33 so it’s recommended that you install the last version of Bugsnag that supported your Expo version: v6.3.0'
        : 'If you want the latest version of @bugsnag/expo hit enter, otherwise type the version you want',
      initial: isPre33 ? '6.3.0' : 'latest',
      validate: str => {
        if (str === 'latest') return true
        if (semver.valid(str)) return true
        if (semver.validRange(str)) return true
        return 'Version must be: a valid semver version/range or "latest"'
      }
    }, { onCancel })
    return version
  } catch (e) {
    throw new Error(`Could not detect Expo version in package.json: ${e.message}`)
  }
}

const npmOrYarn = async (dir) => {
  try {
    await promisify(readFile)(join(dir, 'yarn.lock'))
    return 'yarn'
  } catch (e) {
    return 'npm'
  }
}
