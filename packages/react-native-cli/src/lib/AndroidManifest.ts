import path from 'path'
import { Logger } from '../Logger'
import { promises as fs } from 'fs'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/#android'
const UNLOCATED_PROJ_MSG = `The Android configuration was not in the expected location and so couldn't be updated automatically.

Add your API key to the AndroidManifest.xml in your project.

See ${DOCS_LINK} for more information`

const MATCH_FAIL_MSG = `The project's AndroidManifest.xml couldn't be updated automatically as it was in an unexpected format.

Add your API key to the AndroidManifest.xml in your project.

See ${DOCS_LINK} for more information`

const APP_END_REGEX = /\n\s*<\/application>/

export async function addApiKey (projectRoot: string, apiKey: string, logger: Logger): Promise<void> {
  const manifestPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
  try {
    const manifest = await fs.readFile(manifestPath, 'utf8')
    const activityStartMatch = /(\s*)<activity/.exec(manifest)
    const appEndMatch = APP_END_REGEX.exec(manifest)
    if (manifest.includes('com.bugsnag.android.API_KEY')) {
      logger.warn('API key is already present, skipping')
      return
    }
    if (!activityStartMatch || !appEndMatch) {
      logger.warn(MATCH_FAIL_MSG)
      return
    }
    const activityStartIndent = activityStartMatch[1]
    const updatedManifest = manifest.replace(
      APP_END_REGEX,
      `${activityStartIndent}<meta-data android:name="com.bugsnag.android.API_KEY" android:value="${apiKey}" />${appEndMatch}`
    )
    await fs.writeFile(manifestPath, updatedManifest, 'utf8')
    logger.success('Updated AndroidManifest.xml')
  } catch (e) {
    logger.warn(UNLOCATED_PROJ_MSG)
  }
}
