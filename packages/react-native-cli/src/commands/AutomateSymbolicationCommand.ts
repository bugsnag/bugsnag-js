import prompts from 'prompts'
import fs from 'fs'
import { join } from 'path'
import logger from '../Logger'
import { updateXcodeProject } from '../lib/Xcode'
import { install, detectInstalledVersion, detectInstalled, guessPackageManager } from '../lib/Npm'
import onCancel from '../lib/OnCancel'
import { checkReactNativeMappings, addUploadEndpoint, addBuildEndpoint } from '../lib/Gradle'
import { UrlType, OnPremiseUrls } from '../lib/OnPremise'

const DSYM_INSTRUCTIONS = `To configure your project to upload dSYMs, follow the iOS symbolication guide:

    https://docs.bugsnag.com/platforms/ios/symbolication-guide/

  This will enable you to see full native stacktraces. It can't be done automatically.

`

const HERMES_INSTRUCTIONS = `You are running a version of React Native that we cannot automatically integrate with due to known issues with the build when Hermes is enabled.

    If you cannot upgrade to a later version of React Native (version 0.68 or above), you can use an older version of this CLI (version 7.20.x or earlier)

  or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')

`

export default async function run (projectRoot: string, urls: OnPremiseUrls): Promise<boolean> {
  try {
    const { iosIntegration } = await prompts({
      type: 'confirm',
      name: 'iosIntegration',
      message: 'Do you want to automatically upload JavaScript source maps as part of the Xcode build?',
      initial: true
    }, { onCancel })

    if (iosIntegration) {
      logger.info('Modifying the Xcode project')
      await updateXcodeProject(projectRoot, urls[UrlType.UPLOAD], logger)
    }

    await prompts({
      type: 'text',
      name: 'dsymUploadInstructions',
      message: DSYM_INSTRUCTIONS,
      initial: 'Hit enter to continue …'
    }, { onCancel })

    const { androidIntegration } = await prompts({
      type: 'confirm',
      name: 'androidIntegration',
      message: 'Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps?',
      initial: true
    }, { onCancel })

    if (androidIntegration) {
      await installBugsnagCliPackage(projectRoot, urls)
      const reactNativeVersion = await detectInstalledVersion('react-native', projectRoot)

      if (reactNativeVersion) {
        var floatNumber = parseFloat(reactNativeVersion)
        if (floatNumber < 0.68) {
          await prompts({
            type: 'text',
            name: 'hermesInstructions',
            message: HERMES_INSTRUCTIONS,
            initial: 'Hit enter to continue …'
          }, { onCancel })
        }
      }

      const { packageJsonIntegration } = await prompts({
        type: 'confirm',
        name: 'packageJsonIntegration',
        message: 'Do you want to add an NPM task to your package.json to upload Android source maps?',
        initial: true
      }, { onCancel })

      if (packageJsonIntegration) {
        await writeToPackageJson(join(projectRoot, 'package.json'), urls[UrlType.UPLOAD], urls[UrlType.BUILD])
      }
    }

    if (iosIntegration) {
      await installJavaScriptPackage(projectRoot)
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
    await addBuildEndpoint(projectRoot, urls[UrlType.BUILD], logger)
  }

  if (urls[UrlType.UPLOAD]) {
    await addUploadEndpoint(projectRoot, urls[UrlType.UPLOAD], logger)
  }

  const alreadyInstalled = await detectInstalled('@bugsnag/cli', projectRoot)

  if (alreadyInstalled) {
    logger.warn('@bugsnag/cli is already installed, skipping')
    return
  }

  logger.info(alreadyInstalled)

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

async function installJavaScriptPackage (projectRoot: string): Promise<void> {
  const alreadyInstalled = await detectInstalled('@bugsnag/source-maps', projectRoot)

  if (alreadyInstalled) {
    logger.warn('@bugsnag/source-maps is already installed, skipping')
    return
  }

  logger.info('Adding @bugsnag/source-maps dependency')

  const packageManager = await guessPackageManager(projectRoot)

  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: 'If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want',
    initial: 'latest'
  }, { onCancel })

  await install(packageManager, '@bugsnag/source-maps', version, true, projectRoot)

  logger.success('@bugsnag/source-maps dependency is installed')
}

async function writeToPackageJson (packageJsonPath: string, uploadUrl: string | undefined, buildUrl: string | undefined): Promise<void> {
  fs.readFile(packageJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading package.json: ${err}`)
      return
    }

    try {
      const packageJson = JSON.parse(data)
      let uploadCommand = './node_modules/.bin/bugsnag-cli upload react-native-android'
      let buildCommand = './node_modules/.bin/bugsnag-cli create-build'

      if (uploadUrl) {
        uploadCommand += ' --upload-api-root-url=' + uploadUrl
      }

      if (buildCommand) {
        buildCommand += ' --build-api-root-url=' + buildUrl
      }

      packageJson.scripts = {
        ...packageJson.scripts,
        'bugsnag:create-build': buildCommand,
        'bugsnag:upload-android': uploadCommand
      }

      const updatedPackageJson = JSON.stringify(packageJson, null, 2)

      fs.writeFile(packageJsonPath, updatedPackageJson, 'utf8', (err) => {
        if (err) {
          console.error(`Error writing package.json: ${err}`)
        }
      })
    } catch (err) {
      console.error(`Error parsing package.json: ${err}`)
    }
  })
}
