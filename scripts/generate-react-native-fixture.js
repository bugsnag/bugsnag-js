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

const INTERNAL_DEPENDENCIES = [
  '@bugsnag/react-native',
  '@bugsnag/plugin-react-navigation',
  '@bugsnag/plugin-react-native-navigation'
]

// make sure we install a compatible versions of peer dependencies
const reactNativeFileAccessVersion = '3.1.1' // parseFloat(reactNativeVersion) <= 0.69 ? '1.7.1' : '3.1.1'
const PEER_DEPENDENCIES = [
  `react-native-file-access@${reactNativeFileAccessVersion}`
]

let reactNavigationVersion = '6.1.18'
let reactNavigationNativeStackVersion = '6.11.0'
let reactNativeScreensVersion = '3.35.0'
let reactNativeSafeAreaContextVersion = '4.14.0'

// RN 0.77 requires react-native-screens 4.6.0, which in turn requires react navigation v7
if (parseFloat(reactNativeVersion) >= 0.77) {
  reactNavigationVersion = '7.1.14'
  reactNavigationNativeStackVersion = '7.3.21'
  reactNativeScreensVersion = '4.11.1'
  reactNativeSafeAreaContextVersion = '5.5.1'
} else if (parseFloat(reactNativeVersion) <= 0.69) {
  reactNativeScreensVersion = '3.14.0'
  reactNativeSafeAreaContextVersion = '4.3.4'
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

// install and build the packages
if (!process.env.SKIP_BUILD_PACKAGES) {
  execFileSync('npm', ['ci'], { cwd: ROOT_DIR, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' } })
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

  iosUtils.configureIOSProject(fixtureDir)

  if (parseFloat(reactNativeVersion) < 0.70) {
    // Older RN versions need to be patched to fix the boost download URL
    const applyPatch = ['apply', '--ignore-whitespace', resolve(replacementFilesDir, 'patches/react-native-boost.patch')]
    execFileSync('git', applyPatch, { cwd: fixtureDir, stdio: 'inherit' })

    // remove the ruby version
    if (fs.existsSync(resolve(fixtureDir, '.ruby-version'))) {
      fs.rmSync(resolve(fixtureDir, '.ruby-version'))
    }
  }

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
  execSync(`npm pack --pack-destination=${fixtureDir} ${workSpaceArgs.join(' ')}`, { cwd: ROOT_DIR, stdio: 'inherit' })

  // pack the scenario launcher
  execSync(`npm pack ${ROOT_DIR}/test/react-native/features/fixtures/scenario-launcher --pack-destination ${fixtureDir}`, { cwd: ROOT_DIR, stdio: 'inherit' })

  // add dependencies for react-native-navigation (wix)
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    PEER_DEPENDENCIES.push(...REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES)
  } else if (!isNewArchEnabled) {
    // add dependencies for @react-navigation
    PEER_DEPENDENCIES.push(...REACT_NAVIGATION_PEER_DEPENDENCIES)
  }

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
