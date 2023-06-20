import prompts from 'prompts'
import logger from '../Logger'
import { updateXcodeProject } from '../lib/Xcode'
import { install, detectInstalled, guessPackageManager } from '../lib/Npm'
import onCancel from '../lib/OnCancel'
import { enableReactNativeMappings } from '../lib/Gradle'
import { UrlType, OnPremiseUrls } from '../lib/OnPremise'

const DSYM_INSTRUCTIONS = `To configure your project to upload dSYMs, follow the iOS symbolication guide:

    https://docs.bugsnag.com/platforms/ios/symbolication-guide/

  This will enable you to see full native stacktraces. It can't be done automatically.

`

export default async function run (projectRoot: string, urls: OnPremiseUrls): Promise<boolean> {
  try {
    const { iosIntegration } = await prompts({
      type: 'confirm',
      name: 'iosIntegration',
      message: 'Do you want to automatically upload JavaScript source maps as part of the Xcode build?',
      initial: true
    }, { onCancel })

    if (iosIntegration) {
      logger.info('Modifying the Xcode project')
      await updateXcodeProject(projectRoot, urls[UrlType.UPLOAD], logger)
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
      message: 'Do you want to automatically upload JavaScript source maps as part of the Gradle build?',
      initial: true
    }, { onCancel })

    if (androidIntegration) {
      await enableReactNativeMappings(projectRoot, urls[UrlType.UPLOAD], urls[UrlType.BUILD], logger)
      await installBugsnagCliPackage(projectRoot)
    }

    if (iosIntegration) {
      await installJavaScriptPackage(projectRoot)
    }
    return true
  } catch (e) {
    logger.error(e)
    return false
  }
}

async function installBugsnagCliPackage (projectRoot: string): Promise<void> {
  const alreadyInstalled = await detectInstalled('@bugsnag/cli', projectRoot)

  if (alreadyInstalled) {
    logger.warn('@bugsnag/cli is already installed, skipping')
    return
  }

  logger.info('Adding @bugsnag/cli dependency')

  const packageManager = await guessPackageManager(projectRoot)

  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: 'If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want',
    initial: 'latest'
  }, { onCancel })

  await install(packageManager, '@bugsnag/cli', version, true, projectRoot)

  logger.success('@bugsnag/cli dependency is installed')
}

async function installJavaScriptPackage (projectRoot: string): Promise<void> {
  const alreadyInstalled = await detectInstalled('@bugsnag/source-maps', projectRoot)

  if (alreadyInstalled) {
    logger.warn('@bugsnag/source-maps is already installed, skipping')
    return
  }

  logger.info('Adding @bugsnag/source-maps dependency')

  const packageManager = await guessPackageManager(projectRoot)

  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: 'If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want',
    initial: 'latest'
  }, { onCancel })

  await install(packageManager, '@bugsnag/source-maps', version, true, projectRoot)

  logger.success('@bugsnag/source-maps dependency is installed')
}
