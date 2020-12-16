import prompts from 'prompts'
import logger from '../Logger'
import onCancel from '../lib/OnCancel'
import * as android from '../lib/AndroidManifest'
import * as ios from '../lib/InfoPlist'

const DEFAULT_NOTIFY_ENDPOINT = 'https://notify.bugsnag.com'
const DEFAULT_SESSIONS_ENDPOINT = 'https://sessions.bugsnag.com'

export default async function run (argv: string[], projectRoot: string, opts: Record<string, unknown>): Promise<void> {
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

    const { notifyEndpoint } = await prompts({
      type: 'text',
      name: 'notifyEndpoint',
      message: 'What is your Bugsnag notify endpoint?',
      initial: DEFAULT_NOTIFY_ENDPOINT
    }, { onCancel })

    const { sessionsEndpoint } = await prompts({
      type: 'text',
      name: 'sessionsEndpoint',
      message: 'What is your Bugsnag sessions endpoint?',
      initial: DEFAULT_SESSIONS_ENDPOINT
    }, { onCancel })

    const options: ios.Options & android.Options = { apiKey }

    if (notifyEndpoint !== DEFAULT_NOTIFY_ENDPOINT) {
      options.notifyEndpoint = notifyEndpoint
    }

    if (sessionsEndpoint !== DEFAULT_SESSIONS_ENDPOINT) {
      options.sessionsEndpoint = sessionsEndpoint
    }

    logger.info('Updating AndroidManifest.xml')
    await android.configure(projectRoot, options, logger)

    logger.info('Updating Info.plist')
    await ios.configure(projectRoot, options, logger)
  } catch (e) {
    logger.error(e)
  }
}
