import { Logger } from '../Logger'
import path from 'path'
import { promises as fs } from 'fs'
import { promisify } from 'util'
import glob from 'glob'

const asyncGlob = promisify(glob)

const BUGSNAG_JS_IMPORT_INIT =
`import Bugsnag from "@bugsnag/react-native";
Bugsnag.start();`

const BUGSNAG_COCOA_IMPORT = '#import <Bugsnag/Bugsnag.h>'
const BUGSNAG_COCOA_INIT = '[Bugsnag start];'
const COCOA_APP_LAUNCH_REGEX = /(-\s*\(BOOL\)\s*application:\s*\(UIApplication\s\*\)\s*application\s+didFinishLaunchingWithOptions:\s*\(NSDictionary\s*\*\)launchOptions\s*\{\s*)\S/

const BUGSNAG_JAVA_IMPORT = 'import com.bugsnag.android.Bugsnag;'
const BUGSNAG_JAVA_INIT = 'Bugsnag.start(this);'
const JAVA_APP_ON_CREATE_REGEX = /(public void onCreate\s*\(\)\s*\{[^]*super\.onCreate\(\);(\s*))\S/

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/#basic-configuration'
const FAIL_MSG = (filename: string) =>
`Failed to update "${filename}" automatically. The file may not exist or it may be in an unexpected format or location.

Bugsnag must be imported manually. See ${DOCS_LINK} for more information.`

export async function insertJs (projectRoot: string, logger: Logger): Promise<void> {
  logger.info('Adding Bugsnag to the JS layer')
  const indexJsPath = path.join(projectRoot, 'index.js')
  try {
    const indexJs = await fs.readFile(indexJsPath, 'utf8')

    if (indexJs.includes(BUGSNAG_JS_IMPORT_INIT)) {
      logger.warn('Bugsnag is already included, skipping')
      return
    }

    await fs.writeFile(indexJsPath, `${BUGSNAG_JS_IMPORT_INIT}\n\n${indexJs}`, 'utf8')
    logger.success('Done')
  } catch (e) {
    logger.error(FAIL_MSG('index.js'))
  }
}

export async function insertIos (projectRoot: string, logger: Logger): Promise<void> {
  logger.info('Adding Bugsnag to the iOS layer')

  const iosDir = path.join(projectRoot, 'ios')
  let appDelegatePath

  try {
    console.log('start')
    const xcodeprojDir = (await fs.readdir(iosDir)).find(p => p.endsWith('.xcodeproj'))
    console.log('xcodeprojDir' + xcodeprojDir )

    if (!xcodeprojDir) {
      logger.warn(FAIL_MSG('AppDelegate'))
      return
    }

    const appDelegateDirectory = path.join(iosDir, xcodeprojDir.replace(/\.xcodeproj$/, ''))
    console.log('appDelegateDirectory' + appDelegateDirectory )

    // handle both AppDelegate.m and AppDelegate.mm (RN 0.68+)
    const appDelegateFile = (await fs.readdir(appDelegateDirectory)).find(p => p.startsWith('AppDelegate.m'))
    console.log('appDelegateFile' + appDelegateFile )

    if (!appDelegateFile) {
      logger.warn(FAIL_MSG('AppDelegate'))
      return
    }

    appDelegatePath = path.join(iosDir, xcodeprojDir.replace(/\.xcodeproj$/, ''), appDelegateFile)
  } catch (e) {
    logger.error(FAIL_MSG('AppDelegate'))
    return
  }

  try {
    const appDelegate = await fs.readFile(appDelegatePath, 'utf8')

    if (appDelegate.includes(BUGSNAG_COCOA_IMPORT) || appDelegate.includes(BUGSNAG_COCOA_INIT)) {
      logger.warn('Bugsnag is already included, skipping')
      return
    }

    const appDelegateWithImport = `${BUGSNAG_COCOA_IMPORT}\n${appDelegate}`
    const appLaunchRes = COCOA_APP_LAUNCH_REGEX.exec(appDelegateWithImport)

    if (!appLaunchRes) {
      logger.warn(FAIL_MSG(path.basename(appDelegatePath)))
      return
    }

    await fs.writeFile(
      appDelegatePath,
      appDelegateWithImport.replace(appLaunchRes[1], `${appLaunchRes[1]}  ${BUGSNAG_COCOA_INIT}\n\n`),
      'utf8'
    )

    logger.success('Done')
  } catch (e) {
    logger.error(FAIL_MSG(path.basename(appDelegatePath)))
  }
}

export async function insertAndroid (projectRoot: string, logger: Logger): Promise<void> {
  logger.info('Adding Bugsnag to the Android layer')

  let mainApplicationPath
  try {
    const javaDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java')
    const relativeMainApplicationPath = (await asyncGlob('**/*/MainApplication.java', {
      cwd: javaDir
    }))[0]
    if (!relativeMainApplicationPath) return logger.warn(FAIL_MSG('MainApplication.java'))
    mainApplicationPath = path.join(javaDir, relativeMainApplicationPath)
  } catch (e) {
    logger.warn(FAIL_MSG('MainApplication.java'))
    return
  }

  try {
    const mainApplication = await fs.readFile(mainApplicationPath, 'utf8')

    if (mainApplication.includes(BUGSNAG_JAVA_IMPORT) || mainApplication.includes(BUGSNAG_JAVA_INIT)) {
      logger.warn('Bugsnag is already included, skipping')
      return
    }

    const mainApplicationWithImport = mainApplication.replace('import', `${BUGSNAG_JAVA_IMPORT}\nimport`)
    const onCreateRes = JAVA_APP_ON_CREATE_REGEX.exec(mainApplicationWithImport)
    if (!onCreateRes) {
      logger.warn(FAIL_MSG('MainApplication.java'))
      return
    }

    await fs.writeFile(mainApplicationPath, mainApplicationWithImport.replace(onCreateRes[1], `${onCreateRes[1]}${BUGSNAG_JAVA_INIT}${onCreateRes[2]}`), 'utf8')
    logger.success('Done')
  } catch (e) {
    logger.error(FAIL_MSG('MainApplication.java'))
  }
}
