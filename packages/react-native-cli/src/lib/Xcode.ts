import { Logger } from '../Logger'
import { promises as fs } from 'fs'
import path from 'path'
import xcode, { Project } from 'xcode'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces/#ios'
const UNLOCATED_PROJ_MSG = `The Xcode project was not in the expected location and so couldn't be updated automatically.

Update the "Bundle React Native Code And Images" build phase with the following environment variables:
export EXTRA_PACKAGER_ARGS="--sourcemap-output $TMPDIR/$(md5 -qs "$CONFIGURATION_BUILD_DIR")-main.jsbundle.map""

See ${DOCS_LINK} for more information`

const EXTRA_PACKAGER_ARGS = 'export EXTRA_PACKAGER_ARGS="--sourcemap-output $TMPDIR/$(md5 -qs "$CONFIGURATION_BUILD_DIR")-main.jsbundle.map"'

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

  const didUpdate = await updateXcodeEnv(projectRoot, logger)
  logger.info('Adding build phase to upload source maps to Bugsnag')

  const didAdd = await addUploadSourceMapsTask(proj, buildPhaseMap, endpoint, logger)
  const didChange = didUpdate || didAdd

  if (!didChange) return

  await fs.writeFile(pbxProjPath, proj.writeSync(), 'utf8')
  logger.success('Written changes to Xcode project')
}

async function addUploadSourceMapsTask (
  proj: Project,
  buildPhaseMap: Record<string, Record<string, unknown>>,
  endpoint: string|undefined,
  logger: Logger
): Promise<boolean> {
  for (const shellBuildPhaseKey in buildPhaseMap) {
    const phase = buildPhaseMap[shellBuildPhaseKey]
    if (typeof phase.shellScript === 'string' && phase.shellScript.includes('bugsnag-react-native-xcode.sh') || typeof phase.shellScript === 'string' && phase.shellScript.includes('Upload source maps to Bugsnag')) {
      logger.warn('An "Upload source maps to Bugsnag" build phase already exists')
      return false
    }
  }

  let shellScript = 'npm run bugsnag:upload-ios'

  proj.addBuildPhase(
    [],
    'PBXShellScriptBuildPhase',
    'Upload source maps to Bugsnag',
    null,
    { shellPath: '/bin/sh', shellScript }
  )

  return true
}

function addExtraPackagerArgs (phaseId: string, existingShellScript: string, logger: Logger): [string, boolean] {
  const parsedExistingShellScript = JSON.parse(existingShellScript) as string
  if (parsedExistingShellScript.includes(EXTRA_PACKAGER_ARGS)) {
    logger.warn(`The "Bundle React Native Code and Images" build phase (${phaseId}) already includes the required arguments`)
    return [existingShellScript, false]
  }
  const scriptLines = parsedExistingShellScript.split('\n')
  return [JSON.stringify([EXTRA_PACKAGER_ARGS].concat(scriptLines).join('\n')), true]
}

function updateXcodeEnv(projectRoot: string, logger: Logger): boolean {
  const searchString = 'SOURCEMAP_FILE=';
  const sourceMapFilePath = 'ios/build/main.jsbundle.map'
  const envFilePath = path.join(projectRoot, 'ios', '.xcode.env')

  const data = fs.readFile(envFilePath, 'utf8').then(
    function (results){
      if (results.includes(searchString)) {
        logger.warn(`The .xcode.env file already contains a section for "${searchString}"`);
        return false;
      } else {
        const newData = `${results}\n\n#React Native Source Map File\n${searchString}${sourceMapFilePath}`;
        fs.writeFile(envFilePath, newData, 'utf8')
        return true
      }

    }).catch(
      function (error){
        logger.warn(`Error updating the .xcode.env file: ${error}`);
        return false
      })

  return true
}
