#!/usr/bin/env node

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

let exportArchive = true

let fixturePath = process.env.FIXTURE_DIR || 'test/react-native-cli/features/fixtures/generated/'

if (isNewArchEnabled) {
  fixturePath += 'new-arch/'
} else {
  fixturePath += 'old-arch/'
}

const fixtureDir = resolve(ROOT_DIR, fixturePath, reactNativeVersion)

const replacementFilesDir = resolve(ROOT_DIR, 'test/react-native-cli/features/fixtures/app/dynamic/')

const PEER_DEPENDENCIES = [
  `@bugsnag/react-native-cli@${notifierVersion}`
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

  iosUtils.configureIOSProject(fixtureDir)

  // install the peer dependencies
  execSync(`npm install --save ${PEER_DEPENDENCIES} --registry ${process.env.REGISTRY_URL} --legacy-peer-deps`, { cwd: fixtureDir, stdio: 'inherit' })

  if (process.env.INIT_RN_CLI === 'true' || process.env.INIT_RN_CLI === '1') {
    enableSourceMaps()
  }
}

// Build the android fixture
if (process.env.BUILD_ANDROID === 'true' || process.env.BUILD_ANDROID === '1') {
  // build the android app
  androidUtils.buildAPK(fixtureDir)
}

// Build the iOS fixture
if (process.env.BUILD_IOS === 'true' || process.env.BUILD_IOS === '1') {
  if (process.env.EXPORT_ARCHIVE !== 'true' || process.env.EXPORT_ARCHIVE !== '1') {
    exportArchive = false
  }
  iosUtils.buildIPA(fixtureDir, exportArchive)
}

function enableSourceMaps () {
  common.changeDir(`${ROOT_DIR}/scripts`)
  const initCommand = `./init-rn-cli.sh ${notifierVersion} ${reactNativeVersion} ${fixtureDir}`
  common.run(initCommand, true)
}

/** Replace native files generated by react-native cli with pre-configured files */
function replaceGeneratedFixtureFiles () {
  // copy the exportOptions.plist file
  fs.copyFileSync(
    resolve(replacementFilesDir, 'ios/exportOptions.plist'),
    resolve(fixtureDir, 'exportOptions.plist')
  )

  // replace the App.js/App.tsx file with our own App.js file
  fs.readdirSync(resolve(fixtureDir))
    .filter((file) => /App\.[tj]sx?$/.test(file))
    .map((file) => fs.unlinkSync(resolve(fixtureDir, file)))

  fs.copyFileSync(
    resolve(replacementFilesDir, 'App.js'),
    resolve(fixtureDir, 'App.js')
  )
}
