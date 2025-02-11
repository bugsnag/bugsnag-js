const { execFileSync, execSync } = require('child_process')
const { resolve } = require('path')
const fs = require('fs')
const common = require('./common')
const androidUtils = require('./react-native/android-utils')
const iosUtils = require('./react-native/ios-utils')

if (!process.env.RN_VERSION) {
  console.error('Please provide a React Native version')
  process.exit(1)
}

if (!process.env.REGISTRY_URL) {
  console.error('Please provide a Registry URL')
  process.exit(1)
}

if (!process.env.RCT_NEW_ARCH_ENABLED || (process.env.RCT_NEW_ARCH_ENABLED !== '1' && process.env.RCT_NEW_ARCH_ENABLED !== '0')) {
  console.error('RCT_NEW_ARCH_ENABLED must be set to 1 or 0')
  process.exit(1)
}

const notifierVersion = process.env.NOTIFIER_VERSION || common.getCommitId()

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

const PEER_DEPENDENCIES = [
  'react-native-file-access@3.1.1',
  `@bugsnag/react-native@${notifierVersion}`,
  `@bugsnag/plugin-react-navigation@${notifierVersion}`,
  `@bugsnag/plugin-react-native-navigation@${notifierVersion}`
]

const SOURCE_MAP_DEPENDENCIES = [
  `@bugsnag/react-native-cli@${notifierVersion}`
]

const reactNavigationVersion = '6.1.18'
const reactNavigationNativeStackVersion = '6.11.0'
const reactNativeScreensVersion = '3.35.0'
const reactNativeSafeAreaContextVersion = '4.14.0'
const REACT_NAVIGATION_PEER_DEPENDENCIES = [
  `@react-navigation/native@${reactNavigationVersion}`,
  `@react-navigation/native-stack@${reactNavigationNativeStackVersion}`,
  `react-native-screens@${reactNativeScreensVersion}`,
  `react-native-safe-area-context@${reactNativeSafeAreaContextVersion}`
]

const reactNativeNavigationVersion = '7.41.0' // Issue with 7.42.0
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
  const RNInitArgs = ['@react-native-community/cli@latest', 'init', 'reactnative', '--directory', fixtureDir, '--version', reactNativeVersion, '--pm', 'npm', '--skip-install']
  execFileSync('npx', RNInitArgs, { stdio: 'inherit' })

  replaceGeneratedFixtureFiles()

  androidUtils.configureAndroidProject(fixtureDir, isNewArchEnabled)

  if (!isNewArchEnabled) {
    // react navigation setup
    androidUtils.configureReactNavigationAndroid(fixtureDir, reactNativeVersion)
  }

  iosUtils.configureIOSProject(fixtureDir)

  installFixtureDependencies()

  if (process.env.ENABLE_SOURCE_MAPS === 'true' || process.env.ENABLE_SOURCE_MAPS === '1') {
    enableSourceMaps()
  }

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

function installFixtureDependencies () {
  // add dependencies for react-native-navigation (wix)
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    PEER_DEPENDENCIES.push(...REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES)
  } else if (!isNewArchEnabled) {
    // add dependencies for @react-navigation
    PEER_DEPENDENCIES.push(...REACT_NAVIGATION_PEER_DEPENDENCIES)
  }

  // add source map dependencies
  if (process.env.ENABLE_SOURCE_MAPS === 'true' || process.env.ENABLE_SOURCE_MAPS === '1') {
    PEER_DEPENDENCIES.push(...SOURCE_MAP_DEPENDENCIES)
  }

  const fixtureDependencyArgs = PEER_DEPENDENCIES.join(' ')

  // install test fixture dependencies
  execSync(`npm install --save ${fixtureDependencyArgs} --registry ${process.env.REGISTRY_URL} --legacy-peer-deps`, { cwd: fixtureDir, stdio: 'inherit' })

  // install the scenario launcher package
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

function enableSourceMaps () {
  common.changeDir(`${ROOT_DIR}/scripts`)
  const initCommand = `./init-rn-cli.sh ${notifierVersion} ${reactNativeVersion} ${fixtureDir}`
  common.run(initCommand, true)
}
