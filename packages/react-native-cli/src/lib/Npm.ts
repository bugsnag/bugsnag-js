import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'

export type PackageManager = 'npm' | 'yarn'

export async function install (packageManager: PackageManager, module: string, version: string, dev: boolean, projectRoot: string): Promise<void> {
  let cmd: Command

  switch (packageManager) {
    case 'yarn':
      cmd = yarnCommand(module, version, dev)
      break
    case 'npm':
      cmd = npmCommand(module, version, dev)
      break
    default:
      throw new Error(`Don’t know what command to use for ${packageManager}`)
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd[0], cmd[1], { cwd: projectRoot, stdio: 'inherit' })

    proc.on('error', err => reject(err))

    proc.on('close', code => {
      if (code === 0) return resolve()
      reject(
        new Error(
          `Command exited with non-zero exit code (${code}) "${cmd[0]} ${cmd[1].join(' ')}"`
        )
      )
    })
  })
}

type Command = [ string, string[] ]
const yarnCommand = (module: string, version: string, dev: boolean): Command => [
  'yarn',
  !dev ? ['add', `${module}@${version}`] : ['add', '--dev', `${module}@${version}`]
]
const npmCommand = (module: string, version: string, dev: boolean): Command => [
  'npm',
  !dev ? ['install', '--save', `${module}@${version}`] : ['install', '--save-dev', `${module}@${version}`]
]

export async function detectInstalledVersion (module: string, projectRoot: string): Promise<string | undefined> {
  try {
    const pkg = JSON.parse(await fs.readFile(join(projectRoot, 'package.json'), 'utf8'))

    if (pkg.dependencies && pkg.dependencies[module]) {
      return pkg.dependencies[module]
    }

    if (pkg.devDependencies && pkg.devDependencies[module]) {
      return pkg.devDependencies[module]
    }

    if (pkg.peerDependencies && pkg.peerDependencies[module]) {
      return pkg.peerDependencies[module]
    }

    return undefined
  } catch (e) {
    throw new Error('Could not load package.json. Is this the project root?')
  }
}

export async function detectInstalled (module: string, projectRoot: string): Promise<boolean> {
  try {
    const pkg = JSON.parse(await fs.readFile(join(projectRoot, 'package.json'), 'utf8'))
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
    return !!allDeps[module]
  } catch (e) {
    throw new Error('Could not load package.json. Is this the project root?')
  }
}

export async function guessPackageManager (projectRoot: string) {
  try {
    await fs.readFile(join(projectRoot, 'yarn.lock'))
    return 'yarn'
  } catch (e) {
    return 'npm'
  }
}
