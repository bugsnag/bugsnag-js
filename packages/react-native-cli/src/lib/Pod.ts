import { spawnSync } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'
import { Logger } from '../Logger'
import { platform } from 'os'

export async function install (projectRoot: string, logger: Logger): Promise<void> {
  if (platform() !== 'darwin') {
    logger.warn('Detected platform is not macOS, skipping')
    return
  }

  try {
    const iosDirList = await fs.readdir(join(projectRoot, 'ios'))
    if (!iosDirList.includes('Podfile')) {
      logger.warn('No Podfile found in ios directory, skipping')
      return
    }
  } catch (e) {
    // @ts-expect-error
    if (e.code === 'ENOENT') {
      logger.warn('No ios directory found in project, skipping')
      return
    }
    throw e
  }

  const res = spawnSync('pod', ['install'], { cwd: join(projectRoot, 'ios'), stdio: 'inherit' })

  if (res.error) {
    if ((res.error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.warn(COCOAPODS_NOT_FOUND)
      return
    }

    throw res.error
  }

  if (res.status !== 0) {
    throw new Error(`Command "pod install" exited with non-zero exit code (${res.status})`)
  }
}

const COCOAPODS_NOT_FOUND = `CocoaPods does not appear to be installed.

Install it and run "pod install" inside the "ios" directory manaully.`
