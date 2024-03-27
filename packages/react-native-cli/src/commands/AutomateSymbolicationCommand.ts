import prompts from 'prompts'
import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../Logger'
import { updateXcodeProject } from '../lib/Xcode'
import { install, detectInstalledVersion, detectInstalled, guessPackageManager } from '../lib/Npm'
import onCancel from '../lib/OnCancel'
import { checkReactNativeMappings, addUploadEndpoint, addBuildEndpoint } from '../lib/Gradle'
import { UrlType, OnPremiseUrls } from '../lib/OnPremise'
import detectIndent from 'detect-indent'
import semver from 'semver'

const DSYM_INSTRUCTIONS = `To configure your project to upload dSYMs, follow the iOS symbolication guide:

    https://docs.bugsnag.com/platforms/ios/symbolication-guide/

  This will enable you to see full native stacktraces. It can't be done automatically.

`

const HERMES_INSTRUCTIONS = `You are running a version of React Native that we cannot automatically integrate with due to known issues with the build when Hermes is enabled.

    If you cannot upgrade to a later version of React Native (version 0.68 or above), you can use an older version of this CLI (version 7.20.x or earlier)

  or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')

`

const BUGSNAG_CLI_INSTRUCTIONS = `The following tasks have been added to your package.json and can be run after a build to upload source maps to BugSnag:

    bugsnag:create-build        - Creates a new build
    bugsnag:upload-android      - Uploads Android source maps
    bugsnag:upload-rn-android   - Uploads React Native Android source maps
    bugsnag:upload-dsym         - Uploads iOS dSYMs
    bugsnag:upload-rn-ios       - Uploads React Native iOS source maps
    bugsnag:upload              - Runs all of the above tasks

    See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details.

`

export default async function run (projectRoot: string, urls: OnPremiseUrls): Promise<boolean> {
  try {
    const { bugsnagCliIntegration } = await prompts({
      type: 'confirm',
      name: 'bugsnagCliIntegration',
      message: 'Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps?',
      initial: true
    }, { onCancel })

    if (bugsnagCliIntegration) {
      await installBugsnagCliPackage(projectRoot, urls)
      const reactNativeVersion = await detectInstalledVersion('react-native', projectRoot)

      if (reactNativeVersion) {
        if (semver.lt(reactNativeVersion, '0.68.0')) {
          await prompts({
            type: 'text',
            name: 'hermesInstructions',
            message: HERMES_INSTRUCTIONS,
            initial: 'Hit enter to continue …'
          }, { onCancel })
        }
      }

      await writeToPackageJson(join(projectRoot, 'package.json'), urls[UrlType.UPLOAD], urls[UrlType.BUILD])

      await prompts({
        type: 'text',
        name: 'bugsnagCliInstructions',
        message: BUGSNAG_CLI_INSTRUCTIONS,
        initial: 'Hit enter to continue …'
      }, { onCancel })

      const { iosIntegration } = await prompts({
        type: 'confirm',
        name: 'iosIntegration',
        message: 'Do you want to update your Xcode build phase to output JavaScript source maps?',
        initial: true
      }, { onCancel })

      if (iosIntegration) {
        logger.info('Modifying the Xcode project')
        await updateXcodeProject(projectRoot, urls[UrlType.UPLOAD], reactNativeVersion as string, logger)

        await prompts({
          type: 'text',
          name: 'dsymUploadInstructions',
          message: DSYM_INSTRUCTIONS,
          initial: 'Hit enter to continue …'
        }, { onCancel })
      }
    }

    return true
  } catch (e) {
    logger.error(e)
    return false
  }
}

async function installBugsnagCliPackage (projectRoot: string, urls: OnPremiseUrls): Promise<void> {
  await checkReactNativeMappings(projectRoot, logger)

  if (urls[UrlType.BUILD]) {
    await addBuildEndpoint(projectRoot, urls[UrlType.BUILD] as string, logger)
  }

  if (urls[UrlType.UPLOAD]) {
    await addUploadEndpoint(projectRoot, urls[UrlType.UPLOAD] as string, logger)
  }

  const alreadyInstalled = await detectInstalled('@bugsnag/cli', projectRoot)

  if (alreadyInstalled) {
    logger.warn('@bugsnag/cli is already installed, skipping')
    return
  }

  logger.info('Adding @bugsnag/cli dependency')

  const packageManager = await guessPackageManager(projectRoot)

  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: 'If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want',
    initial: 'latest'
  }, { onCancel })

  await install(packageManager, '@bugsnag/cli', version, true, projectRoot)

  logger.success('@bugsnag/cli dependency is installed')
}

async function writeToPackageJson (packageJsonPath: string, uploadUrl?: string, buildUrl?: string): Promise<void> {
  try {
    const data = await fs.readFile(packageJsonPath, 'utf8')
    const packageJson = JSON.parse(data)

    // Default to two spaces if indent cannot be detected
    const existingIndent = detectIndent(data).indent || '  '

    let createBuildCommand = 'bugsnag-cli create-build'
    let rnAndroidUploadCommand = 'bugsnag-cli upload react-native-android'
    let androidUploadCommand = 'bugsnag-cli upload android'
    let rnIosUploadCommand = 'bugsnag-cli upload react-native-ios'
    let dsymUploadCommand = 'bugsnag-cli upload dsym'

    if (uploadUrl) {
      rnAndroidUploadCommand += ` --upload-api-root-url=${uploadUrl}`
      androidUploadCommand += ` --upload-api-root-url=${uploadUrl}`
      rnIosUploadCommand += ` --upload-api-root-url=${uploadUrl}`
      dsymUploadCommand += ` --upload-api-root-url=${uploadUrl}`
    }

    if (buildUrl) {
      createBuildCommand += ` --build-api-root-url=${buildUrl}`
    }

    packageJson.scripts = {
      ...packageJson.scripts,
      'bugsnag:create-build': createBuildCommand,
      'bugsnag:upload-android': androidUploadCommand,
      'bugsnag:upload-rn-android': rnAndroidUploadCommand,
      'bugsnag:upload-dsym': dsymUploadCommand,
      'bugsnag:upload-rn-ios': rnIosUploadCommand,
      'bugsnag:upload': androidUploadCommand + ' && ' + rnAndroidUploadCommand + ' && ' + dsymUploadCommand + ' && ' + rnIosUploadCommand
    }

    const updatedPackageJson = JSON.stringify(packageJson, null, existingIndent)

    await fs.writeFile(packageJsonPath, updatedPackageJson, 'utf8')
  } catch (err) {
    console.error(`Error writing package.json: ${err}`)
  }
}
