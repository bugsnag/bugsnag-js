import { Logger } from '../Logger'
import { promises as fs } from 'fs'
import path from 'path'

const GRADLE_PLUGIN_IMPORT = (version: string) => `classpath("com.bugsnag:bugsnag-android-gradle-plugin:${version}")`
const GRADLE_PLUGIN_IMPORT_REGEX = /classpath\(["']com\.bugsnag:bugsnag-android-gradle-plugin:.*["']\)/
const GRADLE_PLUGIN_APPLY = 'apply plugin: "com.bugsnag.android.gradle"'
const GRADLE_PLUGIN_APPLY_REGEX = /apply plugin: ["']com\.bugsnag\.android\.gradle["']/
const GRADLE_ANDROID_PLUGIN_REGEX = /classpath\(["']com.android.tools.build:gradle:[^0-9]*([^'"]+)["']\)/
const DOCS_LINK = 'https://docs.bugsnag.com/build-integrations/gradle/#installation'
const ENABLE_REACT_NATIVE_MAPPINGS = 'bugsnag {\n  uploadReactNativeMappings = true\n}\n'
const ENABLE_REACT_NATIVE_MAPPINGS_REGEX = /^\s*bugsnag {[^}]*uploadReactNativeMappings[^}]*?}/m
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
  } else {
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
      GRADLE_PLUGIN_IMPORT(pluginVersion),
      GRADLE_PLUGIN_IMPORT_REGEX,
      logger
    )
  } catch (e: any) {
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
      GRADLE_PLUGIN_APPLY,
      GRADLE_PLUGIN_APPLY_REGEX,
      logger
    )
  } catch (e: any) {
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

export async function enableReactNativeMappings (
  projectRoot: string,
  uploadEndpoint: string|undefined,
  buildEndpoint: string|undefined,
  logger: Logger
): Promise<void> {
  logger.debug('Enabling Bugsnag Android Gradle plugin React Native mappings')
  const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle')

  try {
    const fileContents = await fs.readFile(appBuildGradlePath, 'utf8')

    // If the file contains a 'bugsnag' configuration section already, add the
    // 'uploadReactNativeMappings' flag to it
    if (/^\s*bugsnag {/m.test(fileContents)) {
      await insertValueAfterPattern(
        appBuildGradlePath,
        /^\s*bugsnag {[^}]*?(?=})/m,
        '  uploadReactNativeMappings = true\n',
        ENABLE_REACT_NATIVE_MAPPINGS_REGEX,
        logger
      )
    } else {
      // If the file doesn't contain bugsnag config already, add it now
      await insertValueAfterPattern(
        appBuildGradlePath,
        /$/,
        ENABLE_REACT_NATIVE_MAPPINGS,
        ENABLE_REACT_NATIVE_MAPPINGS_REGEX,
        logger
      )
    }
  } catch (e: any) {
    if (e.message === 'Pattern not found') {
      logger.warn(
        `The gradle file was in an unexpected format and so couldn't be updated automatically.

Enable React Native mappings to your app module's build.gradle:

${ENABLE_REACT_NATIVE_MAPPINGS}

See ${DOCS_LINK} for more information`
      )

      return
    }

    if (e.code === 'ENOENT') {
      logger.warn(
        `A gradle file was not found at the expected location and so couldn't be updated automatically.

Enable React Native mappings to your app module's build.gradle:

${ENABLE_REACT_NATIVE_MAPPINGS}

See ${DOCS_LINK} for more information`
      )

      return
    }

    throw e
  }

  if (uploadEndpoint) {
    await addUploadEndpoint(appBuildGradlePath, uploadEndpoint, logger)
  }

  if (buildEndpoint) {
    await addBuildEndpoint(appBuildGradlePath, buildEndpoint, logger)
  }

  logger.success('React Native mappings enabled in android/app/build.gradle')
}

async function addUploadEndpoint (appBuildGradlePath: string, uploadEndpoint: string, logger: Logger): Promise<void> {
  try {
    // We know the 'bugsnag' section must exist after enabling RN mappings
    await insertValueAfterPattern(
      appBuildGradlePath,
      /^\s*bugsnag {[^}]*?(?=})/m,
      `  endpoint = "${uploadEndpoint}"\n`,
      UPLOAD_ENDPOINT_REGEX,
      logger
    )
  } catch (e: any) {
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

async function addBuildEndpoint (appBuildGradlePath: string, buildEndpoint: string, logger: Logger): Promise<void> {
  try {
    // We know the 'bugsnag' section must exist after enabling RN mappings
    await insertValueAfterPattern(
      appBuildGradlePath,
      /^\s*bugsnag {[^}]*?(?=})/m,
      `  releasesEndpoint = "${buildEndpoint}"\n`,
      BUILD_ENDPOINT_REGEX,
      logger
    )
  } catch (e: any) {
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

async function insertValueAfterPattern (file: string, pattern: RegExp, value: string, presencePattern: RegExp, logger: Logger): Promise<void> {
  const fileContents = await fs.readFile(file, 'utf8')

  if (presencePattern.test(fileContents)) {
    logger.warn('Value already found in file, skipping.')
    return
  }

  const match = fileContents.match(pattern)
  if (!match || match.index === undefined || !match.input) {
    throw new Error('Pattern not found')
  }

  const splitLocation = match.index + match[0].length
  const [indent] = match[0].match(/[\r\n]\s*/) || ['\n']
  const firstChunk = fileContents.substr(0, splitLocation)
  const lastChunk = fileContents.substring(splitLocation)

  const output = `${firstChunk}${indent}${value}${lastChunk}`

  await fs.writeFile(file, output, 'utf8')
}
