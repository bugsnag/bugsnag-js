import { Logger } from '../Logger'
import { promises as fs } from 'fs'
import path from 'path'

const GRADLE_PLUGIN_IMPORT = (version: string) => `classpath("com.bugsnag:bugsnag-android-gradle-plugin:${version}")`
const GRADLE_PLUGIN_IMPORT_REGEX = /classpath\(["']com\.bugsnag:bugsnag-android-gradle-plugin:.*["']\)/
const GRADLE_PLUGIN_APPLY = 'apply plugin: "com.bugsnag.android.gradle"'
const GRADLE_PLUGIN_APPLY_REGEX = /apply plugin: ["']com\.bugsnag\.android\.gradle["']/
const GRADLE_ANDROID_PLUGIN_REGEX = /classpath\(["']com.android.tools.build:gradle:[^0-9]*([^'"]+)["']\)/
const DOCS_LINK = 'https://docs.bugsnag.com/build-integrations/gradle/#installation'
const BUGSNAG_CONFIGURATION_BLOCK = 'bugsnag {\n}\n'
const BUGSNAG_CONFIGURATION_BLOCK_REGEX = /^\s*bugsnag {[^}]*?}/m
const UPLOAD_ENDPOINT_REGEX = /^\s*bugsnag {[^}]*endpoint[^}]*?}/m
const BUILD_ENDPOINT_REGEX = /^\s*bugsnag {[^}]*releasesEndpoint[^}]*?}/m

export async function getSuggestedBugsnagGradleVersion (projectRoot: string, logger: Logger): Promise<string> {
  let fileContents: string
  try {
    fileContents = await fs.readFile(path.join(projectRoot, 'android', 'build.gradle'), 'utf8')
  } catch (e) {
    return '5+'
  }

  const versionMatchResult = fileContents.match(GRADLE_ANDROID_PLUGIN_REGEX)
  const value = versionMatchResult?.[1]
  const major = parseInt(value?.match(/^([0-9]+)/)?.[1] ?? '', 10)

  if (major < 7) {
    return '5.+'
  } else if (major === 7) {
    return '7.+'
  }  else {
    const versionMatchResult = fileContents.match(/classpath\(["']com.android.tools.build:gradle["']\)/)
    if (versionMatchResult) {
      return '7.+'
    }
    logger.warn(`Cannot determine an appropriate version of the Bugsnag Android Gradle plugin for use in this project.

Please see ${DOCS_LINK} for information on Gradle and the Android Gradle Plugin (AGP) compatibility`)
    return ''
  }
}

export async function modifyRootBuildGradle (projectRoot: string, pluginVersion: string, logger: Logger): Promise<void> {
  logger.debug('Looking for android/build.gradle')
  const topLevelBuildGradlePath = path.join(projectRoot, 'android', 'build.gradle')
  logger.debug('Adding \'bugsnag-android-gradle-plugin\' to the build script classpath')
  try {
    await insertValueAfterPattern(
      topLevelBuildGradlePath,
      /[\r\n]\s*classpath\(["']com.android.tools.build:gradle:.+["']\)/,
      /[\r\n]\s*classpath\(["']com.android.tools.build:gradle["']\)/,
      GRADLE_PLUGIN_IMPORT(pluginVersion),
      GRADLE_PLUGIN_IMPORT_REGEX,
      logger
    )
  } catch (e) {
    if (e.message === 'Pattern not found') {
      logger.warn(
        `The gradle file was in an unexpected format and so couldn't be updated automatically.

Add '${GRADLE_PLUGIN_IMPORT(pluginVersion)}' to the 'buildscript.dependencies section of android/build.gradle

See ${DOCS_LINK} for more information`
      )
    } else if (e.code === 'ENOENT') {
      logger.warn(
        `A gradle file was not found at the expected location and so couldn't be updated automatically.

Add '${GRADLE_PLUGIN_IMPORT(pluginVersion)}' to the 'buildscript.dependencies section of your project's build.gradle

See ${DOCS_LINK} for more information`
      )
    } else {
      throw e
    }
  }
  logger.success('Finished modifying android/build.gradle')
}

export async function modifyAppBuildGradle (projectRoot: string, logger: Logger): Promise<void> {
  logger.debug('Looking for android/app/build.gradle')
  const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle')
  logger.debug('Applying com.bugsnag.android.gradle plugin')

  try {
    await insertValueAfterPattern(
      appBuildGradlePath,
      /^apply from: ["']\.\.\/\.\.\/node_modules\/react-native\/react\.gradle["']$/m,
      // apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
      /^apply from: file\(["']..\/\.\.\/node_modules\/@react-native-community\/cli-platform-android\/native_modules\.gradle["']\); applyNativeModulesAppBuildGradle\(project\)$/m,
      GRADLE_PLUGIN_APPLY,
      GRADLE_PLUGIN_APPLY_REGEX,
      logger
    )
  } catch (e) {
    if (e.message === 'Pattern not found') {
      logger.warn(
        `The gradle file was in an unexpected format and so couldn't be updated automatically.

Add '${GRADLE_PLUGIN_APPLY}' to android/app/build.gradle

See ${DOCS_LINK} for more information`
      )
    } else if (e.code === 'ENOENT') {
      logger.warn(
        `A gradle file was not found at the expected location and so couldn't be updated automatically.

Add '${GRADLE_PLUGIN_APPLY}' to your app module's build.gradle

See ${DOCS_LINK} for more information`
      )
    } else {
      throw e
    }
  }

  logger.success('Finished modifying android/app/build.gradle')
}

export async function checkReactNativeMappings (
  projectRoot: string,
  logger: Logger
): Promise<void> {
  logger.debug('Enabling Bugsnag Android Gradle plugin React Native mappings')
  const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle')

  try {
    const fileContents = await fs.readFile(appBuildGradlePath, 'utf8')

    if (/^\s*uploadReactNativeMappings\s*=\s*true/m.test(fileContents)) {
      logger.warn(
        `The uploadReactNativeMappings option for the Bugsnag Gradle plugin is currently enabled in ${appBuildGradlePath}.

This is no longer required as mappings will be uploaded by the BugSnag CLI.

Please remove this line or disable it in your builds to prevent duplicate uploads.`
      )
    }
  } catch (e) {
    // No action required
  }
}

async function insertBugsnagConfigBlock (
  appBuildGradlePath: string,
  logger: Logger
): Promise<void> {
  logger.debug('Inserting Bugsnag config block')

  await insertValueAfterPattern(
    appBuildGradlePath,
    /$/,
    RegExp('\n'),
    BUGSNAG_CONFIGURATION_BLOCK,
    BUGSNAG_CONFIGURATION_BLOCK_REGEX,
    logger
  )
  logger.success('Bugsnag config block inserted into android/app/build.gradle')
}

export async function addUploadEndpoint (projectRoot: string, uploadEndpoint: string, logger: Logger): Promise<void> {
  try {
    const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle')

    await insertBugsnagConfigBlock(appBuildGradlePath, logger)

    await insertValueAfterPattern(
      appBuildGradlePath,
      /^\s*bugsnag {[^}]*?(?=})/m,
      RegExp('\n'),
      `  endpoint = "${uploadEndpoint}"\n`,
      UPLOAD_ENDPOINT_REGEX,
      logger
    )
  } catch (e) {
    if (e.message === 'Pattern not found') {
      logger.warn(
        `The gradle file was in an unexpected format and so couldn't be updated automatically.

Add your upload endpoint to your app module's build.gradle:

bugsnag {
  endpoint = "${uploadEndpoint}"
}

See ${DOCS_LINK} for more information`
      )
    } else if (e.code === 'ENOENT') {
      logger.warn(
        `A gradle file was not found at the expected location and so couldn't be updated automatically.

Add your upload endpoint to your app module's build.gradle:

bugsnag {
  endpoint = "${uploadEndpoint}"
}

See ${DOCS_LINK} for more information`
      )
    } else {
      throw e
    }
  }
}

export async function addBuildEndpoint (projectRoot: string, buildEndpoint: string, logger: Logger): Promise<void> {
  try {
    const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle')

    await insertBugsnagConfigBlock(appBuildGradlePath, logger)

    await insertValueAfterPattern(
      appBuildGradlePath,
      /^\s*bugsnag {[^}]*?(?=})/m,
      RegExp('\n'),
      `  releasesEndpoint = "${buildEndpoint}"\n`,
      BUILD_ENDPOINT_REGEX,
      logger
    )
  } catch (e) {
    if (e.message === 'Pattern not found') {
      logger.warn(
        `The gradle file was in an unexpected format and so couldn't be updated automatically.

Add your build endpoint to your app module's build.gradle:

bugsnag {
  releasesEndpoint = "${buildEndpoint}"
}

See ${DOCS_LINK} for more information`
      )
    } else if (e.code === 'ENOENT') {
      logger.warn(
        `A gradle file was not found at the expected location and so couldn't be updated automatically.

Add your build endpoint to your app module's build.gradle:

bugsnag {
  releasesEndpoint = "${buildEndpoint}"
}

See ${DOCS_LINK} for more information`
      )
    } else {
      throw e
    }
  }
}

async function insertValueAfterPattern (file: string, pattern: RegExp, pattern2: RegExp, value: string, presencePattern: RegExp, logger: Logger): Promise<void> {
  const fileContents = await fs.readFile(file, 'utf8')

  if (presencePattern.test(fileContents)) {
    logger.warn('Value already found in file, skipping.')
    return
  }
  let match = fileContents.match(pattern)
  if (!match || match.index === undefined || !match.input) {
    if (pattern2.source === '\\n') {
      throw new Error('Pattern not found');
    }
    match = fileContents.match(pattern2);
    if (!match || match.index === undefined || !match.input) {
      throw new Error('Pattern not found');
    }
  }

  const splitLocation = match.index + match[0].length
  const [indent] = match[0].match(/[\r\n]\s*/) || ['\n']
  const firstChunk = fileContents.substr(0, splitLocation)
  const lastChunk = fileContents.substring(splitLocation)

  const output = `${firstChunk}${indent}${value}${lastChunk}`

  await fs.writeFile(file, output, 'utf8')
}
