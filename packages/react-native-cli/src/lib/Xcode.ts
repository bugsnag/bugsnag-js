import { Logger } from '../Logger'
import { promises as fs } from 'fs'
import path from 'path'
import xcode from 'xcode'
import semver from 'semver'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces/#ios'
const UNLOCATED_PROJ_MSG = `The Xcode project was not in the expected location and so couldn't be updated automatically.

Please see ${DOCS_LINK} for more information`

const EXTRA_INPUT_FILES = ['"$(SRCROOT)/.xcode.env.local"', '"$(SRCROOT)/.xcode.env"']
const EXTRA_PACKAGER_ARGS = 'export SOURCE_MAP_PATH=$(pwd)/build/sourcemaps\nif [ ! -d "$SOURCE_MAP_PATH" ]; then\n\tmkdir -p "$SOURCE_MAP_PATH";\nfi\nexport EXTRA_PACKAGER_ARGS="--sourcemap-output $(pwd)/build/sourcemaps/main.jsbundle.map"'

export async function updateXcodeProject (projectRoot: string, endpoint: string|undefined, reactNativeVersion: string|undefined, logger: Logger) {
  const iosDir = path.join(projectRoot, 'ios')
  const xcodeprojDir = (await fs.readdir(iosDir)).find(p => p.endsWith('.xcodeproj'))

  if (!xcodeprojDir) {
    logger.warn(UNLOCATED_PROJ_MSG)
    return
  }

  const pbxProjPath = path.join(iosDir, xcodeprojDir, 'project.pbxproj')
  const proj = xcode.project(pbxProjPath)

  await new Promise<void>((resolve, reject) => {
    proj.parse((err) => {
      if (err) return reject(err)
      resolve()
    })
  })

  const buildPhaseMap = proj?.hash?.project?.objects?.PBXShellScriptBuildPhase || []
  logger.info('Ensuring React Native build phase outputs source maps')

  const didUpdate = await updateBuildReactNativeTask(buildPhaseMap, iosDir, reactNativeVersion, logger)

  if (!didUpdate) return

  await fs.writeFile(pbxProjPath, proj.writeSync(), 'utf8')
  logger.success('Written changes to Xcode project')
}

async function updateBuildReactNativeTask (buildPhaseMap: Record<string, Record<string, unknown>>, iosDir: string, reactNativeVersion: string | undefined, logger: Logger): Promise<boolean> {
  let didAnythingUpdate = false
  let didThisUpdate

  for (const shellBuildPhaseKey in buildPhaseMap) {
    const phase = buildPhaseMap[shellBuildPhaseKey]
    // The shell script can vary slightly... Vanilla RN projects contain
    //   ../node_modules/react-native/scripts/react-native-xcode.sh
    // and ejected Expo projects contain
    //   `node --print "require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'"`
    // so we need a little leniency
    if (typeof phase.shellScript === 'string' && phase.shellScript.includes('/react-native-xcode.sh')) {
      if (reactNativeVersion) {
        // If we're dealing with RN >= 0.69.0 setup the .xcode.env file to export the source maps to our happy path
        if (semver.gte(reactNativeVersion, '0.69.0')) {
          [phase.inputPaths, didThisUpdate] = addExtraInputFiles(shellBuildPhaseKey, phase.inputPaths as string[], logger)
          if (didThisUpdate) {
            didAnythingUpdate = true
          }
        } else {
          // If we're dealing with RN < 0.69.0 add the extra package arguments to the xcode build phase as use of the .xcode.env file is not supported.
          [phase.shellScript, didThisUpdate] = addExtraPackagerArgs(shellBuildPhaseKey, phase.shellScript, logger)
          if (didThisUpdate) {
            didAnythingUpdate = true
          }
        }
      }
    }
  }

  await updateXcodeEnv(iosDir, logger)

  return didAnythingUpdate
}

function addExtraInputFiles (phaseId: string, existingInputFiles: string[], logger: Logger): [string[], boolean] {
  if (arrayContainsElements(existingInputFiles, EXTRA_INPUT_FILES)) {
    logger.info(`The "Bundle React Native Code and Images" build phase (${phaseId}) already includes the required arguments`)
    return [existingInputFiles, false]
  }
  return [EXTRA_INPUT_FILES.concat(existingInputFiles), true]
}

function arrayContainsElements (mainArray: any[], subArray: any[]): boolean {
  return subArray.every(element => mainArray.some(mainElement => mainElement === element))
}

function addExtraPackagerArgs (phaseId: string, existingShellScript: string, logger: Logger): [string, boolean] {
  const parsedExistingShellScript = JSON.parse(existingShellScript) as string
  if (parsedExistingShellScript.includes(EXTRA_PACKAGER_ARGS)) {
    logger.info(`The "Bundle React Native Code and Images" build phase (${phaseId}) already includes the required arguments`)
    return [existingShellScript, false]
  }
  const scriptLines = parsedExistingShellScript.split('\n')
  return [JSON.stringify([EXTRA_PACKAGER_ARGS].concat(scriptLines).join('\n')), true]
}

async function updateXcodeEnv (iosDir: string, logger: Logger): Promise<boolean> {
  const searchString = 'SOURCEMAP_FILE='
  const envFilePath = path.join(iosDir, '.xcode.env')

  try {
    await fs.readFile(envFilePath)

    const xcodeEnvData = await fs.readFile(envFilePath, 'utf8')

    if (xcodeEnvData?.includes(searchString)) {
      logger.warn(`The .xcode.env file already contains a section for "${searchString}"`)
      return false
    } else {
      const newData = `${xcodeEnvData}\n\n# React Native Source Map File\nexport SOURCE_MAP_PATH=$(pwd)/build/sourcemaps\nif [ ! -d "$SOURCE_MAP_PATH" ]; then\n\tmkdir -p "$SOURCE_MAP_PATH";\nfi\nexport ${searchString}$(pwd)/build/sourcemaps/main.jsbundle.map`
      await fs.writeFile(envFilePath, newData, 'utf8')
      return true
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      const newData = `export NODE_BINARY=$(command -v node)\n\n# React Native Source Map File\nexport SOURCE_MAP_PATH=$(pwd)/build/sourcemaps\nif [ ! -d "$SOURCE_MAP_PATH" ]; then\n\tmkdir -p "$SOURCE_MAP_PATH";\nfi\nexport ${searchString}$(pwd)/build/sourcemaps/main.jsbundle.map`

      await fs.writeFile(envFilePath, newData, 'utf8')
      return true
    } else {
      console.error(`Error updating .xcode.env file: ${error.message}`)
      return false
    }
  }
}
