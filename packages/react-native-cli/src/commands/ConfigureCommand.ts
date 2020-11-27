import prompts from 'prompts'
import logger from '../Logger'
import onCancel from '../lib/OnCancel'
import { addApiKey as addApiKeyAndroid } from '../lib/AndroidManifest'
import { addApiKey as addApiKeyIos } from '../lib/InfoPlist'

export default async function run (argv: string[], opts: Record<string, unknown>): Promise<void> {
  const projectRoot = process.cwd()

  try {
    const { apiKey } = await prompts({
      type: 'text',
      name: 'apiKey',
      message: 'What is your Bugsnag API key?',
      validate: value => {
        return /[A-Fa-f0-9]{32}/.test(value)
          ? true
          : 'API key is required. You can find it by going to https://app.bugsnag.com/settings/ > Projects'
      }
    }, { onCancel })

    logger.info('Adding API key to AndroidManifest.xml')
    await addApiKeyAndroid(projectRoot, apiKey, logger)

    logger.info('Adding API key to Info.plist')
    await addApiKeyIos(projectRoot, apiKey, logger)
  } catch (e) {
    logger.error(e)
  }
}
