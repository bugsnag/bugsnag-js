import prompts from 'prompts'
import logger from '../Logger'
import onCancel from '../lib/OnCancel'
import * as android from '../lib/AndroidManifest'
import * as ios from '../lib/InfoPlist'
import { UrlType, OnPremiseUrls } from '../lib/OnPremise'

export default async function run (projectRoot: string, urls: OnPremiseUrls): Promise<boolean> {
  try {
    const { apiKey } = await prompts({
      type: 'text',
      name: 'apiKey',
      message: 'What is your Bugsnag project API key?',
      validate: value => {
        return /^[A-Fa-f0-9]{32}$/.test(value)
          ? true
          : 'API key is required. You can find it by going to https://app.bugsnag.com/settings/ > Projects > [your-project] > Notifier API key'
      }
    }, { onCancel })

    const options: ios.Options & android.Options = { apiKey }

    if (urls[UrlType.NOTIFY]) {
      options.notifyEndpoint = urls[UrlType.NOTIFY]
    }

    if (urls[UrlType.SESSIONS]) {
      options.sessionsEndpoint = urls[UrlType.SESSIONS]
    }

    logger.info('Updating AndroidManifest.xml')
    await android.configure(projectRoot, options, logger)

    logger.info('Updating Info.plist')
    await ios.configure(projectRoot, options, logger)
    return true
  } catch (e) {
    logger.error(e)
    return false
  }
}
