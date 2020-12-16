import path from 'path'
import { Logger } from '../Logger'
import { promises as fs } from 'fs'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/#android'
const APP_END_REGEX = /\n\s*<\/application>/

export interface Options {
  apiKey: string
  notifyEndpoint?: string
  sessionsEndpoint?: string
}

const PROPERTY_NAMES: Record<keyof Options, string> = {
  apiKey: 'API_KEY',
  notifyEndpoint: 'ENDPOINT_NOTIFY',
  sessionsEndpoint: 'ENDPOINT_SESSIONS'
}

const HUMAN_READABLE_PROPERTY_NAMES: Record<keyof Options, string> = {
  apiKey: 'API key',
  notifyEndpoint: 'notify endpoint',
  sessionsEndpoint: 'sessions endpoint'
}

export async function configure (projectRoot: string, options: Options, logger: Logger): Promise<void> {
  const manifestPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')

  try {
    const manifest = await fs.readFile(manifestPath, 'utf8')

    const activityStartMatch = /(\s*)<activity/.exec(manifest)
    const appEndMatch = APP_END_REGEX.exec(manifest)

    if (!activityStartMatch || !appEndMatch) {
      logger.warn(getNoMatchMessage(options))
      return
    }

    let metadataTags: string = ''
    const activityStartIndent = activityStartMatch[1]

    for (const [key, value] of Object.entries(options)) {
      const propertyName = PROPERTY_NAMES[key as keyof Options]
      const humanReadableName = HUMAN_READABLE_PROPERTY_NAMES[key as keyof Options]

      if (manifest.includes(`com.bugsnag.android.${propertyName}`)) {
        const capitalised = humanReadableName[0].toUpperCase() + humanReadableName.slice(1)

        logger.warn(`${capitalised} is already present, skipping`)
        continue
      }

      metadataTags += `${activityStartIndent}<meta-data android:name="com.bugsnag.android.${propertyName}" android:value="${value}" />`
    }

    if (metadataTags === '') {
      return
    }

    const updatedManifest = manifest.replace(APP_END_REGEX, metadataTags + appEndMatch)

    await fs.writeFile(manifestPath, updatedManifest, 'utf8')

    logger.success('Updated AndroidManifest.xml')
  } catch (e) {
    logger.warn(getUnableToFindProjectMessage(options))
  }
}

function getUnableToFindProjectMessage (options: Options): string {
  return `The Android configuration was not in the expected location and so couldn't be updated automatically.

Add your ${humanReadableOptions(options)} to the AndroidManifest.xml in your project.

See ${DOCS_LINK} for more information`
}

function getNoMatchMessage (options: Options): string {
  return `The project's AndroidManifest.xml couldn't be updated automatically as it was in an unexpected format.

Add your ${humanReadableOptions(options)} to the AndroidManifest.xml in your project.

See ${DOCS_LINK} for more information`
}

function humanReadableOptions (options: Options): string {
  return Object.keys(options)
    .map(key => HUMAN_READABLE_PROPERTY_NAMES[key as keyof Options])
    .join(', ')
    .replace(/,(?=[^,]*$)/, ' and')
}
