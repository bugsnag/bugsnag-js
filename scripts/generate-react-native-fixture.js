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

const replacementFilesDir = resolve(ROOT_DIR, 'test/react-native/features/fixtures/replacements/')

const INTERNAL_DEPENDENCIES = [
  '@bugsnag/react-native',
  '@bugsnag/request-tracker',
  '@bugsnag/plugin-network-instrumentation'
]

// make sure we install a compatible versions of peer dependencies
const reactNativeFileAccessVersion = '3.1.1' // parseFloat(reactNativeVersion) <= 0.69 ? '1.7.1' : '3.1.1'
const PEER_DEPENDENCIES = [
  `react-native-file-access@${reactNativeFileAccessVersion}`
]

// react-native-screens new-arch support:
// library version   react-native version
// 4.19.0+           0.81.0+
// 4.14.0+           0.79.0+
// 4.5.0+            0.77.0+
// 4.0.0+            0.76.0+
// 3.33.0+           0.75.0+
// 3.32.0+           0.74.0+
// 3.28.0+           0.73.0+
// 3.21.0+           0.72.0+
// 3.19.0+           0.71.0+
// 3.18.0+           0.70.0+
// 3.14.0+           0.69.0+

// default to the latest versions - update here when new versions are released or new RN versions come out
let reactNavigationVersion = '^7.0.0'
let reactNavigationNativeStackVersion = '^7.0.0'
let reactNativeSafeAreaContextVersion = '^5.0.0'
let reactNativeScreensVersion = '~4.19.0'

// Adjust versions based on React Native version
const rnVersion = parseFloat(reactNativeVersion)
switch (true) {
  case rnVersion >= 0.81:
    reactNativeScreensVersion = '~4.19.0'
    break
  case rnVersion >= 0.79:
    reactNativeScreensVersion = '~4.14.0'
    break
  case rnVersion >= 0.78:
    reactNativeScreensVersion = '~4.11.0'
    break
  case rnVersion >= 0.76:
    reactNativeScreensVersion = '~4.0.0'
    break
  case rnVersion >= 0.75:
    reactNavigationVersion = '^6.0.0'
    reactNavigationNativeStackVersion = '^6.0.0'
    reactNativeScreensVersion = '~3.33.0'
    break
  case rnVersion >= 0.74:
    reactNavigationVersion = '^6.0.0'
    reactNavigationNativeStackVersion = '^6.0.0'
    reactNativeScreensVersion = '~3.32.0'
    break
  case rnVersion >= 0.73:
    reactNavigationVersion = '^6.0.0'
    reactNavigationNativeStackVersion = '^6.0.0'
    reactNativeSafeAreaContextVersion = '4.14.0'
    reactNativeScreensVersion = '~3.28.0'
    break
  case rnVersion >= 0.72:
    reactNavigationVersion = '^6.0.0'
    reactNavigationNativeStackVersion = '^6.0.0'
    reactNativeSafeAreaContextVersion = '4.14.0'
    reactNativeScreensVersion = '~3.21.0'
    break
  case rnVersion <= 0.69:
    reactNavigationVersion = '^6.0.0'
    reactNavigationNativeStackVersion = '^6.0.0'
    reactNativeSafeAreaContextVersion = '4.3.4'
    reactNativeScreensVersion = '~3.14.0'
    break
}

const REACT_NAVIGATION_PEER_DEPENDENCIES = [
  `@react-navigation/native@${reactNavigationVersion}`,
  `@react-navigation/native-stack@${reactNavigationNativeStackVersion}`,
  `react-native-screens@${reactNativeScreensVersion}`,
  `react-native-safe-area-context@${reactNativeSafeAreaContextVersion}`
]

const REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES = [
  'react-native-navigation@7.41.0' // Issue with 7.42.0
]

// add packages and dependencies for react-native-navigation (wix)
if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
  INTERNAL_DEPENDENCIES.push('@bugsnag/plugin-react-native-navigation')
  PEER_DEPENDENCIES.push(...REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES)
} else if (process.env.REACT_NAVIGATION === 'true' || process.env.REACT_NAVIGATION === '1') {
  // add packages and dependencies for @react-navigation
  INTERNAL_DEPENDENCIES.push('@bugsnag/plugin-react-navigation')
  PEER_DEPENDENCIES.push(...REACT_NAVIGATION_PEER_DEPENDENCIES)
}

// install and build the packages
if (!process.env.SKIP_BUILD_PACKAGES) {
  execFileSync('npm', ['ci', '--legacy-peer-deps'], { cwd: ROOT_DIR, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' } })
  execFileSync('npm', ['run', 'build'], { cwd: ROOT_DIR, stdio: 'inherit' })
}

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

  installFixtureDependencies()

  androidUtils.configureAndroidProject(fixtureDir, isNewArchEnabled)

  if (!isNewArchEnabled) {
    // react navigation setup
    androidUtils.configureReactNavigationAndroid(fixtureDir, reactNativeVersion)
  }

  iosUtils.configureIOSProject(fixtureDir, reactNativeVersion)

  // link react-native-navigation using rnn-link tool
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    execSync('npx rnn-link', { cwd: fixtureDir, stdio: 'inherit' })
  }
}

// Build the android fixture
if (process.env.BUILD_ANDROID === 'true' || process.env.BUILD_ANDROID === '1') {
  // build the android app
  androidUtils.buildAPK(fixtureDir, isNewArchEnabled)
}

// Build the iOS fixture
if (process.env.BUILD_IOS === 'true' || process.env.BUILD_IOS === '1') {
  iosUtils.buildIPA(fixtureDir)
}

function installFixtureDependencies () {
  // get the react native package plus all of it's dependencies
  const bugsnagReactNativePkg = JSON.parse(fs.readFileSync(`${ROOT_DIR}/packages/react-native/package.json`, 'utf8'))
  const bugsnagPackages = Object.keys(bugsnagReactNativePkg.dependencies)
    .filter(dep => dep.startsWith('@bugsnag/')).concat(INTERNAL_DEPENDENCIES)

  // pack the bugsnag packages into the test fixture directory
  const workSpaceArgs = bugsnagPackages.map(dep => `--workspace=${dep}`)
  execFileSync('npm', ['pack', `--pack-destination=${fixtureDir}`, ...workSpaceArgs], { cwd: ROOT_DIR, stdio: 'inherit' })

  // pack the scenario launcher
  execFileSync('npm', ['pack', resolve(ROOT_DIR, 'test/react-native/features/fixtures/scenario-launcher'), '--pack-destination', fixtureDir], { cwd: ROOT_DIR, stdio: 'inherit' })

  const fixtureDependencyArgs = PEER_DEPENDENCIES.join(' ')

  // install dependencies
  execSync(`npm install --save --save-exact ${fixtureDependencyArgs} *.tgz`, { cwd: fixtureDir, stdio: 'inherit' })
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
