import prompts from 'prompts'
import logger from '../Logger'
import { modifyRootBuildGradle, modifyAppBuildGradle } from '../lib/Gradle'
import { updateXcodeProject } from '../lib/Xcode'
import { install, detectInstalled, guessPackageManager } from '../lib/Npm'
import onCancel from '../lib/OnCancel'

const DSYM_INSTRUCTIONS = `To configure your project to upload dSYMs, follow the iOS symbolication guide:

    https://docs.bugsnag.com/platforms/ios/symbolication-guide/

  This will enable you to see full native stacktraces. It can't be done automatically.

`

export default async function run (argv: string[], projectRoot: string, opts: Record<string, unknown>): Promise<void> {
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

    await prompts({
      type: 'text',
      name: 'dsymUploadInstructions',
      message: DSYM_INSTRUCTIONS,
      initial: 'Hit enter to continue …'
    }, { onCancel })

    const { androidIntegration } = await prompts({
      type: 'confirm',
      name: 'androidIntegration',
      message: 'Do you want to automatically upload source maps as part of the Gradle build?',
      initial: true
    }, { onCancel })

    if (androidIntegration) {
      logger.info('Modifying the Gradle build')
      const { gradlePluginVersion } = await prompts({
        type: 'text',
        name: 'gradlePluginVersion',
        message: 'If you want the latest version of the Bugsnag Android Gradle plugin hit enter, otherwise type the version you want',
        initial: '5.+'
      }, { onCancel })
      await modifyRootBuildGradle(projectRoot, gradlePluginVersion, logger)
      await modifyAppBuildGradle(projectRoot, logger)
    }

    if (androidIntegration || iosIntegration) {
      const alreadyInstalled = await detectInstalled('@bugsnag/source-maps', projectRoot)
      if (alreadyInstalled) {
        logger.warn('@bugsnag/source-maps is already installed, skipping')
      } else {
        logger.info('Adding @bugsnag/source-maps dependency')
        const packageManager = await guessPackageManager(projectRoot)

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
