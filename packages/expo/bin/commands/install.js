const prompts = require('prompts')
const { promisify } = require('util')
const { readFile } = require('fs')
const { join } = require('path')
const install = require('../lib/install')
const { onCancel } = require('../lib/utils')

module.exports = async (argv, globalOpts) => {
  const projectRoot = globalOpts['project-root']
  const alreadyInstalled = await checkManifest(projectRoot)
  const isWanted = await confirmWanted(alreadyInstalled, projectRoot)
  if (isWanted) {
    const tool = await withTool(projectRoot)
    await install(tool)
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

const npmOrYarn = async (dir) => {
  try {
    await promisify(readFile)(join(dir, 'yarn.lock'))
    return 'yarn'
  } catch (e) {
    return 'npm'
  }
}
