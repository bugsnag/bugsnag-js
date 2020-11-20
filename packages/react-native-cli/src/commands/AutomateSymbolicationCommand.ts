import prompts from 'prompts'
import logger from '../Logger'
import { modifyRootBuildGradle, modifyAppBuildGradle } from '../lib/Gradle'
import { updateXcodeProject } from '../lib/Xcode'
import { install, detectInstalled, guessPackageManager } from '../lib/Npm'
import onCancel from '../lib/OnCancel'

export default async function run (argv: string[], opts: Record<string, unknown>): Promise<void> {
  const projectRoot = process.cwd()

  try {
    const { iosIntegration } = await prompts({
      type: 'confirm',
      name: 'iosIntegration',
      message: 'Do you want to automatically upload source maps as part of the Xcode build?',
      initial: true
    }, { onCancel })

    if (iosIntegration) {
      logger.info('Modifying the Xcode project')
      await updateXcodeProject(projectRoot, logger)
    }

    const { androidIntegration } = await prompts({
      type: 'confirm',
      name: 'androidIntegration',
      message: 'Do you want to automatically upload source maps as part of the gradle build?',
      initial: true
    }, { onCancel })

    if (androidIntegration) {
      logger.info('Modifying the Gradle build')
      await modifyRootBuildGradle(projectRoot, logger)
      await modifyAppBuildGradle(projectRoot, logger)
    }

    if (androidIntegration || iosIntegration) {
      const alreadyInstalled = await detectInstalled('@bugsnag/source-maps', projectRoot)
      if (alreadyInstalled) {
        logger.warn('@bugsnag/source-maps is already installed, skipping')
      } else {
        logger.info('Adding @bugsnag/source-maps dependency')
        const { packageManager } = await prompts({
          type: 'select',
          name: 'packageManager',
          message: 'Using yarn or npm?',
          choices: [
            { title: 'npm', value: 'npm' },
            { title: 'yarn', value: 'yarn' }
          ],
          initial: await guessPackageManager(projectRoot) === 'npm' ? 0 : 1
        })

        const { version } = await prompts({
          type: 'text',
          name: 'version',
          message: 'If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want',
          initial: 'latest'
        }, { onCancel })

        await install(packageManager, '@bugsnag/source-maps', version, true, projectRoot)
      }
      logger.success('@bugsnag/source-maps dependency is installed')
    }
  } catch (e) {
    logger.error(e)
  }
}
