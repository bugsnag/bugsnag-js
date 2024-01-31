import { Logger } from '../Logger'
import { promises as fs } from 'fs'
import path from 'path'
import xcode, { Project } from 'xcode'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces/#ios'
const UNLOCATED_PROJ_MSG = `The Xcode project was not in the expected location and so couldn't be updated automatically.

Please see ${DOCS_LINK} for more information`

const EXTRA_PACKAGER_ARGS = ['"$(SRCROOT)/.xcode.env.local"', '"$(SRCROOT)/.xcode.env"']

export async function updateXcodeProject (projectRoot: string, endpoint: string|undefined, logger: Logger) {
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

  const didUpdate = await updateBuildReactNativeTask(buildPhaseMap, iosDir, logger)
  logger.info('Adding build phase to upload source maps to Bugsnag')
  const didAdd = await addUploadSourceMapsTask(proj, buildPhaseMap, endpoint, logger)

  const didChange = didUpdate || didAdd

  if (!didChange) return

  await fs.writeFile(pbxProjPath, proj.writeSync(), 'utf8')
  logger.success('Written changes to Xcode project')
}

async function updateBuildReactNativeTask (buildPhaseMap: Record<string, Record<string, unknown>>, iosDir: string, logger: Logger): Promise<boolean> {
  let didAnythingUpdate = false
  for (const shellBuildPhaseKey in buildPhaseMap) {
    const phase = buildPhaseMap[shellBuildPhaseKey]
    // The shell script can vary slightly... Vanilla RN projects contain
    //   ../node_modules/react-native/scripts/react-native-xcode.sh
    // and ejected Expo projects contain
    //   `node --print "require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'"`
    // so we need a little leniency
    if (typeof phase.shellScript === 'string' && phase.shellScript.includes('/react-native-xcode.sh')) {
      let didThisUpdate
      [phase.inputPaths, didThisUpdate] = addExtraInputFiles(shellBuildPhaseKey, phase.inputPaths as string[], logger)
      if (didThisUpdate) {
        didAnythingUpdate = true
      }
    }
  }

  await updateXcodeEnv(iosDir, logger)

  return didAnythingUpdate
}

async function addUploadSourceMapsTask (
  proj: Project,
  buildPhaseMap: Record<string, Record<string, unknown>>,
  endpoint: string|undefined,
  logger: Logger
): Promise<boolean> {
  for (const shellBuildPhaseKey in buildPhaseMap) {
    const phase = buildPhaseMap[shellBuildPhaseKey]
    if (typeof phase.shellScript === 'string' && (phase.shellScript.includes('bugsnag-react-native-xcode.sh') || phase.shellScript.includes('npm run bugsnag:upload-ios'))) {
      logger.warn('An "Upload source maps to Bugsnag" build phase already exists')
      return false
    }
  }

  const shellScript = 'npm run bugsnag:upload-ios'

  proj.addBuildPhase(
    [],
    'PBXShellScriptBuildPhase',
    'Upload source maps to Bugsnag',
    null,
    { shellPath: '/bin/sh', shellScript }
  )

  return true
}

function addExtraInputFiles (phaseId: string, existingInputFiles: string[], logger: Logger): [string[], boolean] {
  if (arrayContainsElements(existingInputFiles, EXTRA_PACKAGER_ARGS)) {
    logger.warn(`The "Bundle React Native Code and Images" build phase (${phaseId}) already includes the required arguments`)
    return [existingInputFiles, false]
  }
  return [EXTRA_PACKAGER_ARGS.concat(existingInputFiles), true]
}

function arrayContainsElements (mainArray: any[], subArray: any[]): boolean {
  return subArray.every(element => mainArray.some(mainElement => mainElement === element))
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
