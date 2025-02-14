import { Logger } from '../Logger'
import path from 'path'
import { promises as fs } from 'fs'
import { promisify } from 'util'
import glob from 'glob'

const asyncGlob = promisify(glob)

const BUGSNAG_JS_IMPORT_INIT =
`import Bugsnag from "@bugsnag/react-native";
Bugsnag.start();`

const BUGSNAG_COCOA_OBJ_C_IMPORT = '#import <Bugsnag/Bugsnag.h>'
const BUGSNAG_COCOA_OBJ_C_INIT = '[Bugsnag start];'
const COCOA_OBJ_C_APP_LAUNCH_REGEX = /(-\s*\(BOOL\)\s*application:\s*\(UIApplication\s\*\)\s*application\s+didFinishLaunchingWithOptions:\s*\(NSDictionary\s*\*\)launchOptions\s*\{\s*)\S/

const BUGSNAG_COCOA_SWIFT_IMPORT = 'import Bugsnag'
const BUGSNAG_COCOA_SWIFT_INIT = 'Bugsnag.start()'
const COCOA_SWIFT_APP_LAUNCH_REGEX = /(override func application\s*\(\s*_ application:\s*UIApplication,\s*didFinishLaunchingWithOptions launchOptions:\s*\[UIApplication\.LaunchOptionsKey\s*:\s*Any\]\?\s*=\s*nil\)\s*->\s*Bool\s*\{\s)/

const BUGSNAG_JAVA_IMPORT = 'import com.bugsnag.android.Bugsnag;'
const BUGSNAG_JAVA_INIT = 'Bugsnag.start(this);'
const JAVA_APP_ON_CREATE_REGEX = /(public void onCreate\s*\(\)\s*\{[^]*super\.onCreate\(\);(\s*))\S/

const BUGSNAG_KOTLIN_IMPORT = 'import com.bugsnag.android.Bugsnag'
const BUGSNAG_KOTLIN_INIT = 'Bugsnag.start(this)'
const KOTLIN_APP_ON_CREATE_REGEX = /(override fun onCreate\s*\(\)\s*\{[^]*super\.onCreate\(\)(\s*))\S/

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
    const xcodeprojDir = (await fs.readdir(iosDir)).find(p => p.endsWith('.xcodeproj'))

    if (!xcodeprojDir) {
      logger.warn(FAIL_MSG('AppDelegate'))
      return
    }

    const appDelegateDirectory = path.join(iosDir, xcodeprojDir.replace(/\.xcodeproj$/, ''))

    // handle AppDelegate.m, AppDelegate.mm (RN 0.68+) and AppDelegate.swift (RN 0.77+)
    const appDelegateFile = (await fs.readdir(appDelegateDirectory)).find(p => p.startsWith('AppDelegate.m') || p.startsWith('AppDelegate.swift'))

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
    const isSwift = path.extname(appDelegatePath) === '.swift'
    const cocoaImport = isSwift ? BUGSNAG_COCOA_SWIFT_IMPORT : BUGSNAG_COCOA_OBJ_C_IMPORT
    const cocoaInit = isSwift ? BUGSNAG_COCOA_SWIFT_INIT : BUGSNAG_COCOA_OBJ_C_INIT
    const cocoaAppLaunchRegex = isSwift ? COCOA_SWIFT_APP_LAUNCH_REGEX : COCOA_OBJ_C_APP_LAUNCH_REGEX
    const indent = isSwift ? '    ' : '  '

    const appDelegate = await fs.readFile(appDelegatePath, 'utf8')

    if (appDelegate.includes(cocoaImport) || appDelegate.includes(cocoaInit)) {
      logger.warn('Bugsnag is already included, skipping')
      return
    }

    const appDelegateWithImport = `${cocoaImport}\n${appDelegate}`
    const appLaunchRes = cocoaAppLaunchRegex.exec(appDelegateWithImport)

    if (!appLaunchRes) {
      logger.warn(FAIL_MSG(path.basename(appDelegatePath)))
      return
    }

    await fs.writeFile(
      appDelegatePath,
      appDelegateWithImport.replace(appLaunchRes[1], `${appLaunchRes[1]}${indent}${cocoaInit}\n\n`),
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
    const relativeMainApplicationPathJava = (await asyncGlob('**/*/MainApplication.java', {
      cwd: javaDir
    }))[0]

    const relativeMainApplicationPathKotlin = (await asyncGlob('**/*/MainApplication.kt', {
      cwd: javaDir
    }))[0]

    const relativeMainApplicationPath = relativeMainApplicationPathJava || relativeMainApplicationPathKotlin

    if (!relativeMainApplicationPath) {
      return logger.warn(FAIL_MSG('MainApplication'))
    }
    mainApplicationPath = path.join(javaDir, relativeMainApplicationPath)
  } catch (e) {
    logger.warn(FAIL_MSG('MainApplication'))
    return
  }

  try {
    const isKotlin = path.extname(mainApplicationPath) === '.kt'
    const bugsnagImport = isKotlin ? BUGSNAG_KOTLIN_IMPORT : BUGSNAG_JAVA_IMPORT
    const bugsnagInit = isKotlin ? BUGSNAG_KOTLIN_INIT : BUGSNAG_JAVA_INIT
    const onCreateRegex = isKotlin ? KOTLIN_APP_ON_CREATE_REGEX : JAVA_APP_ON_CREATE_REGEX

    const mainApplication = await fs.readFile(mainApplicationPath, 'utf8')
    if (mainApplication.includes(bugsnagImport) || mainApplication.includes(bugsnagInit)) {
      logger.warn('Bugsnag is already included, skipping')
      return
    }

    const mainApplicationWithImport = mainApplication.replace('import', `${bugsnagImport}\nimport`)
    const onCreateRes = onCreateRegex.exec(mainApplicationWithImport)
    if (!onCreateRes) {
      logger.warn(FAIL_MSG('MainApplication'))
      return
    }

    await fs.writeFile(mainApplicationPath, mainApplicationWithImport.replace(onCreateRes[1], `${onCreateRes[1]}${bugsnagInit}${onCreateRes[2]}`), 'utf8')
    logger.success('Done')
  } catch (e) {
    logger.error(FAIL_MSG('MainApplication'))
  }
}
