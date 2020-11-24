import prompts from 'prompts'
import logger from '../Logger'
import { install as npmInstall, detectInstalled, guessPackageManager } from '../lib/Npm'
import { install as podInstall } from '../lib/Pod'
import onCancel from '../lib/OnCancel'

export default async function run (argv: string[], opts: Record<string, unknown>): Promise<void> {
  const projectRoot = process.cwd()

  try {
    const alreadyInstalled = await detectInstalled('@bugsnag/react-native', projectRoot)
    if (alreadyInstalled) {
      logger.warn('@bugsnag/react-native is already installed, skipping')
    } else {
      logger.info('Adding @bugsnag/react-native dependency')
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
        message: 'If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want',
        initial: 'latest'
      }, { onCancel })

      await npmInstall(packageManager, '@bugsnag/react-native', version, false, projectRoot)
      logger.info('Installing cocoapods')
      await podInstall(projectRoot, logger)
    }
  } catch (e) {
    logger.error(e)
  }
}
