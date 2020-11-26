import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'
import { Logger } from '../Logger'

export async function install (projectRoot: string, logger: Logger): Promise<void> {
  try {
    const iosDirList = await fs.readdir(join(projectRoot, 'ios'))
    if (!iosDirList.includes('Podfile')) {
      logger.warn('No Podfile found in ios directory, skipping')
      return
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      logger.warn('No ios directory found in project, skipping')
      return
    }
    throw e
  }
  return new Promise((resolve, reject) => {
    const proc = spawn('pod', ['install'], { cwd: join(projectRoot, 'ios'), stdio: 'inherit' })

    proc.on('error', err => reject(err))

    proc.on('close', code => {
      if (code === 0) return resolve()
      reject(
        new Error(
          `Command exited with non-zero exit code (${code}) "pod install"`
        )
      )
    })
  })
}
