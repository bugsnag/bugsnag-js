import prompts from 'prompts'
import logger from '../Logger'
import { install as npmInstall, detectInstalled, guessPackageManager } from '../lib/Npm'
import { install as podInstall } from '../lib/Pod'
import onCancel from '../lib/OnCancel'
import { getSuggestedBugsnagGradleVersion, modifyRootBuildGradle, modifyAppBuildGradle } from '../lib/Gradle'

export default async function run (argv: string[], projectRoot: string, opts: Record<string, unknown>): Promise<boolean> {
  try {
    await installJavaScriptPackage(projectRoot)

    logger.info('Installing CocoaPods')
    await podInstall(projectRoot, logger)
    return true
  } catch (e) {
    logger.error(e)
    return false
  }
}

async function installJavaScriptPackage (projectRoot: string): Promise<void> {
  const alreadyInstalled = await detectInstalled('@bugsnag/react-native', projectRoot)

  if (alreadyInstalled) {
    logger.warn('@bugsnag/react-native is already installed, skipping')
    return
  }

  logger.info('Adding @bugsnag/react-native dependency')

  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: 'If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want',
    initial: 'latest'
  }, { onCancel })

  const packageManager = await guessPackageManager(projectRoot)

  await npmInstall(packageManager, '@bugsnag/react-native', version, false, projectRoot)
}
