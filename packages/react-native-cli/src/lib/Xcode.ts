import { Logger } from '../Logger'
import { promises as fs } from 'fs'
import path from 'path'
import xcode, { Project } from 'xcode'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces/#ios'
const UNLOCATED_PROJ_MSG = `The Xcode project was not in the expected location and so couldn't be updated automatically.

Update the "Bundle React Native Code And Images" build phase with the following environment variables:
export EXTRA_PACKAGER_ARGS="--sourcemap-output $TMPDIR/$(md5 -qs "$CONFIGURATION_BUILD_DIR")-main.jsbundle.map""

See ${DOCS_LINK} for more information`

const EXTRA_PACKAGER_ARGS = ['$(SRCROOT)/.xcode.env.local', '$(SRCROOT)/.xcode.env']

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

  const didUpdate = await updateBuildReactNativeTask(buildPhaseMap, logger)
  logger.info('Adding build phase to upload source maps to Bugsnag')

  const didAdd = await addUploadSourceMapsTask(proj, buildPhaseMap, endpoint, logger)
  const didChange = didUpdate || didAdd

  if (!didChange) return

  await fs.writeFile(pbxProjPath, proj.writeSync(), 'utf8')
  logger.success('Written changes to Xcode project')
}

async function updateBuildReactNativeTask (buildPhaseMap: Record<string, Record<string, unknown>>, logger: Logger): Promise<boolean> {
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
      [phase.inputPaths, didThisUpdate] = addExtraPackagerArgs(shellBuildPhaseKey, phase.inputPaths as string[], logger)
      if (didThisUpdate) {
        didAnythingUpdate = true
      }
      logger.info(phase.inputPaths)
    }
  }
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
    if (typeof phase.shellScript === 'string' && phase.shellScript.includes('bugsnag-react-native-xcode.sh')) {
      logger.warn('An "Upload source maps to Bugsnag" build phase already exists')
      return false
    }
  }

  let shellScript = 'SOURCE_MAP="$TMPDIR/$(md5 -qs "$CONFIGURATION_BUILD_DIR")-main.jsbundle.map" ../node_modules/@bugsnag/react-native/bugsnag-react-native-xcode.sh'

  if (endpoint) {
    shellScript = `export ENDPOINT='${endpoint}'\\n${shellScript}`
  }

  proj.addBuildPhase(
    [],
    'PBXShellScriptBuildPhase',
    'Upload source maps to Bugsnag',
    null,
    { shellPath: '/bin/sh', shellScript }
  )

  return true
}

function addExtraPackagerArgs (phaseId: string, existingInputFiles: string[], logger: Logger): [string[], boolean] {
  if (arrayContainsElements(existingInputFiles, EXTRA_PACKAGER_ARGS)) {
    logger.warn(`The "Bundle React Native Code and Images" build phase (${phaseId}) already includes the required arguments`)
    return [existingInputFiles, false]
  }
  return [EXTRA_PACKAGER_ARGS.concat(existingInputFiles), true]
}

function arrayContainsElements (mainArray: any[], subArray: any[]): boolean {
  return subArray.every(element => mainArray.some(mainElement => mainElement === element))
}
