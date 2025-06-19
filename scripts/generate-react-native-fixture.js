#!/usr/bin/env node

const { execFileSync, execSync } = require('child_process')
const { resolve } = require('path')
const fs = require('fs')
const androidUtils = require('./react-native/android-utils')
const iosUtils = require('./react-native/ios-utils')

if (!process.env.RN_VERSION) {
  console.error('Please provide a React Native version')
  process.exit(1)
}

if (!process.env.RCT_NEW_ARCH_ENABLED || (process.env.RCT_NEW_ARCH_ENABLED !== '1' && process.env.RCT_NEW_ARCH_ENABLED !== '0')) {
  console.error('RCT_NEW_ARCH_ENABLED must be set to 1 or 0')
  process.exit(1)
}

const reactNativeVersion = process.env.RN_VERSION
const ROOT_DIR = resolve(__dirname, '../')

const isNewArchEnabled = process.env.RCT_NEW_ARCH_ENABLED === '1'

let fixturePath = 'test/react-native/features/fixtures/generated/'

if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
  fixturePath += 'react-native-navigation/'
}

if (isNewArchEnabled) {
  fixturePath += 'new-arch/'
} else {
  fixturePath += 'old-arch/'
}

const fixtureDir = resolve(ROOT_DIR, fixturePath, reactNativeVersion)
const replacementFilesDir = resolve(ROOT_DIR, 'test/react-native/features/fixtures/app/dynamic/')

let reactNavigationVersion = '6.1.18'
let reactNavigationNativeStackVersion = '6.11.0'
let reactNativeScreensVersion = '3.35.0'
let reactNativeSafeAreaContextVersion = '4.14.0'

// RN 0.77 requires react-native-screens 4.6.0, which in turn requires react navigation v7
if (parseFloat(reactNativeVersion) >= 0.77) {
  reactNavigationVersion = '7.0.14'
  reactNavigationNativeStackVersion = '7.2.0'
  reactNativeScreensVersion = '4.9.0'
  reactNativeSafeAreaContextVersion = '5.2.0'
}

const REACT_NAVIGATION_PEER_DEPENDENCIES = [
  `@react-navigation/native@${reactNavigationVersion}`,
  `@react-navigation/native-stack@${reactNavigationNativeStackVersion}`,
  `react-native-screens@${reactNativeScreensVersion}`,
  `react-native-safe-area-context@${reactNativeSafeAreaContextVersion}`
]

const reactNativeNavigationVersion = '7.41.0'
const REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES = [
  `react-native-navigation@${reactNativeNavigationVersion}`
]

// Generate the fixture
if (!process.env.SKIP_GENERATE_FIXTURE) {
  // remove the fixture directory if it already exists
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }

  // create the test fixture
  const RNInitArgs = ['@react-native-community/cli@16', 'init', 'reactnative', '--directory', fixtureDir, '--version', reactNativeVersion, '--pm', 'npm', '--skip-install']
  execFileSync('npx', RNInitArgs, { stdio: 'inherit' })

  replaceGeneratedFixtureFiles()

  androidUtils.configureAndroidProject(fixtureDir, isNewArchEnabled)

  if (!isNewArchEnabled) {
    // react navigation setup
    androidUtils.configureReactNavigationAndroid(fixtureDir, reactNativeVersion)
  }

  iosUtils.configureIOSProject(fixtureDir)

  installFixtureDependencies()

  // link react-native-navigation using rnn-link tool
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    execSync('npx rnn-link', { cwd: fixtureDir, stdio: 'inherit' })
  }
}

// Build the android fixture
if (process.env.BUILD_ANDROID === 'true' || process.env.BUILD_ANDROID === '1') {
  // build the android app
  androidUtils.buildAPK(fixtureDir)
}

// Build the iOS fixture
if (process.env.BUILD_IOS === 'true' || process.env.BUILD_IOS === '1') {
  iosUtils.buildIPA(fixtureDir)
}

// Pack all the required Bugsnag packages
function packLocalPackages () {
  // Build all packages first
  execSync('npm install', { cwd: ROOT_DIR, stdio: 'inherit' })
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' })

  const packagesDir = resolve(ROOT_DIR, 'packages')
  const packages = [
    'react-native',
    'plugin-react-native-navigation',
    'plugin-react-navigation'
  ]

  // Pack each package and move the tarballs to the fixture directory
  for (const pkg of packages) {
    execSync(`npm pack "${resolve(packagesDir, pkg)}" --pack-destination "${fixtureDir}"`, { stdio: 'inherit' })
  }
}

function installFixtureDependencies () {
  // Pack local packages first
  packLocalPackages()

  // Install non-Bugsnag dependencies
  const externalDependencies = []

  // Add dependencies for react-native-navigation (wix)
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    externalDependencies.push(...REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES)
  } else if (!isNewArchEnabled) {
    // Add dependencies for @react-navigation
    externalDependencies.push(...REACT_NAVIGATION_PEER_DEPENDENCIES)
  }

  // Add react-native-file-access which is a non-Bugsnag dependency
  externalDependencies.push('react-native-file-access@3.1.1')

  // Install external dependencies first
  if (externalDependencies.length > 0) {
    execSync(`npm install --save --save-exact ${externalDependencies.join(' ')} --legacy-peer-deps`, { cwd: fixtureDir, stdio: 'inherit' })
  }

  // Install local Bugsnag packages from tarballs
  execSync('npm install --save bugsnag-*.tgz --legacy-peer-deps', { cwd: fixtureDir, stdio: 'inherit' })

  // Pack and install the scenario launcher package
  const scenarioLauncherPackage = `${ROOT_DIR}/test/react-native/features/fixtures/scenario-launcher`
  execSync(`npm pack ${scenarioLauncherPackage} --pack-destination ${fixtureDir}`, { cwd: ROOT_DIR, stdio: 'inherit' })
  execSync('npm install --save bugsnag-react-native-scenarios-*.tgz', { cwd: fixtureDir, stdio: 'inherit' })
}

/** Replace native files generated by react-native cli with pre-configured files */
function replaceGeneratedFixtureFiles () {
  // replace the App.js/App.tsx file with our own App.js file
  fs.readdirSync(resolve(fixtureDir))
    .filter((file) => /App\.[tj]sx?$/.test(file))
    .map((file) => fs.unlinkSync(resolve(fixtureDir, file)))

  fs.copyFileSync(
    resolve(replacementFilesDir, 'App.js'),
    resolve(fixtureDir, 'App.js')
  )

  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    fs.copyFileSync(
      resolve(replacementFilesDir, 'react-native-navigation/index.js'),
      resolve(fixtureDir, 'index.js')
    )
  }

  // copy the exportOptions.plist file
  fs.copyFileSync(
    resolve(replacementFilesDir, 'ios/exportOptions.plist'),
    resolve(fixtureDir, 'exportOptions.plist')
  )
}
