import { Logger } from '../Logger'
import plist from 'plist'
import path from 'path'
import { promises as fs } from 'fs'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/#ios'
const UNLOCATED_PROJ_MSG = `The Xcode configuration was not in the expected location and so couldn't be updated automatically.

Add your API key to the Info.plist in your project.

See ${DOCS_LINK} for more information`

const PLIST_FAIL_MSG = `The project's Info.plist couldn't be updated automatically. The plist file may not be valid XML.

Add your API key to the Info.plist in your project manually.

See ${DOCS_LINK} for more information`

export async function addApiKey (projectRoot: string, apiKey: string, logger: Logger): Promise<void> {
  const iosDir = path.join(projectRoot, 'ios')
  let xcodeprojDir
  try {
    xcodeprojDir = (await fs.readdir(iosDir)).find(p => p.endsWith('.xcodeproj'))
    if (!xcodeprojDir) {
      logger.warn(UNLOCATED_PROJ_MSG)
      return
    }
  } catch (e) {
    logger.warn(UNLOCATED_PROJ_MSG)
    return
  }
  const plistPath = path.join(iosDir, xcodeprojDir.replace(/\.xcodeproj$/, ''), 'Info.plist')
  try {
    const infoPlist = plist.parse(await fs.readFile(plistPath, 'utf8'))
    infoPlist.bugsnag = { apiKey }
    await fs.writeFile(plistPath, `${plist.build(infoPlist, { indent: '\t', indentSize: 1, offset: -1 })}\n`, 'utf8')
    logger.success('Updating Info.plist')
  } catch (e) {
    logger.warn(PLIST_FAIL_MSG)
  }
}
