const { execFileSync, execSync } = require('child_process')
const { resolve } = require('path')
const fs = require('fs')
const common = require('./common')

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

  configureAndroidProject()

  configureIOSProject()

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
  execFileSync('./gradlew', ['assembleRelease'], { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
  fs.copyFileSync(`${fixtureDir}/android/app/build/outputs/apk/release/app-release.apk`, `${fixtureDir}/reactnative.apk`)
}

// Build the iOS fixture
if (process.env.BUILD_IOS === 'true' || process.env.BUILD_IOS === '1') {
  fs.rmSync(`${fixtureDir}/reactnative.xcarchive`, { recursive: true, force: true })

  // install pods
  execFileSync('bundle', ['install'], { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })
  execFileSync('bundle', ['exec', 'pod', 'install', '--repo-update'], { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })

  // build the ios app
  const archiveArgs = [
    'xcodebuild',
    'DEVELOPMENT_TEAM=7W9PZ27Y5F',
    '-workspace',
    'reactnative.xcworkspace',
    '-scheme',
    'reactnative',
    '-configuration',
    'Release',
    '-archivePath',
    `${fixtureDir}/reactnative.xcarchive`,
    '-allowProvisioningUpdates',
    'archive'
  ]

  execFileSync('xcrun', archiveArgs, { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })

  // export the archive
  const exportArgs = [
    'xcodebuild',
    '-exportArchive',
    '-archivePath',
    'reactnative.xcarchive',
    '-exportPath',
    'output/',
    '-exportOptionsPlist',
    'exportOptions.plist'
  ]

  execFileSync('xcrun', exportArgs, { cwd: fixtureDir, stdio: 'inherit' })
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

function configureIOSProject () {
  // update the bundle identifier in pbxproj
  let pbxProjContents = fs.readFileSync(`${fixtureDir}/ios/reactnative.xcodeproj/project.pbxproj`, 'utf8')
  pbxProjContents = pbxProjContents.replaceAll('org.reactjs.native.example', 'com.bugsnag.fixtures')
  fs.writeFileSync(`${fixtureDir}/ios/reactnative.xcodeproj/project.pbxproj`, pbxProjContents)

  // disable Flipper
  let podfileContents = fs.readFileSync(`${fixtureDir}/ios/Podfile`, 'utf8')
  if (podfileContents.includes('use_flipper!')) {
    podfileContents = podfileContents.replace(/use_flipper!/, '# use_flipper!')
  } else if (podfileContents.includes(':flipper_configuration')) {
    podfileContents = podfileContents.replace(/:flipper_configuration/, '# :flipper_configuration')
  }

  fs.writeFileSync(`${fixtureDir}/ios/Podfile`, podfileContents)

  // pin xcodeproj version to < 1.26.0
  const gemfilePath = resolve(fixtureDir, 'Gemfile')
  if (fs.existsSync(gemfilePath)) {
    let gemfileContents = fs.readFileSync(gemfilePath, 'utf8')
    gemfileContents += '\ngem \'xcodeproj\', \'< 1.26.0\''
    if (!gemfileContents.includes('concurrent-ruby')) {
      gemfileContents += '\ngem \'concurrent-ruby\', \'<= 1.3.4\''
    }
    fs.writeFileSync(gemfilePath, gemfileContents)
    fs.writeFileSync(gemfilePath, gemfileContents.replace(/concurrent-ruby/, 'concurrent-ruby', '<= 1.3.4'))
  }

  // set NSAllowsArbitraryLoads to allow http traffic for all domains (bitbar public IP + bs-local.com)
  const plistpath = `${fixtureDir}/ios/reactnative/Info.plist`
  let plistContents = fs.readFileSync(plistpath, 'utf8')
  const allowArbitraryLoads = '<key>NSAllowsArbitraryLoads</key>\n\t\t<true/>'
  let searchPattern, replacement
  if (plistContents.includes('<key>NSAllowsArbitraryLoads</key>')) {
    searchPattern = '<key>NSAllowsArbitraryLoads</key>\n\t\t<false/>'
    replacement = allowArbitraryLoads
  } else {
    searchPattern = '<key>NSAppTransportSecurity</key>\n\t<dict>'
    replacement = `${searchPattern}\n\t\t${allowArbitraryLoads}`
  }

  // remove the NSAllowsLocalNetworking key if it exists as this causes NSAllowsArbitraryLoads to be ignored
  const allowLocalNetworking = '<key>NSAllowsLocalNetworking</key>\n\t\t<true/>'
  plistContents = plistContents.replace(allowLocalNetworking, '')

  fs.writeFileSync(plistpath, plistContents.replace(searchPattern, replacement))
}

function configureAndroidProject () {
  // set android:usesCleartextTraffic="true" in AndroidManifest.xml
  const androidManifestPath = `${fixtureDir}/android/app/src/main/AndroidManifest.xml`
  let androidManifestContents = fs.readFileSync(androidManifestPath, 'utf8')
  androidManifestContents = androidManifestContents.replace('<application', '<application android:usesCleartextTraffic="true"')
  fs.writeFileSync(androidManifestPath, androidManifestContents)

  // enable/disable the new architecture in gradle.properties
  const gradlePropertiesPath = `${fixtureDir}/android/gradle.properties`
  let gradlePropertiesContents = fs.readFileSync(gradlePropertiesPath, 'utf8')
  gradlePropertiesContents = gradlePropertiesContents.replace(/newArchEnabled\s*=\s*(true|false)/, `newArchEnabled=${isNewArchEnabled}`)
  fs.writeFileSync(gradlePropertiesPath, gradlePropertiesContents)

  if (!isNewArchEnabled) {
    // react navigation setup
    configureReactNavigationAndroid()
  }
}

function configureReactNavigationAndroid () {
  const fileExtension = parseFloat(reactNativeVersion) < 0.73 ? 'java' : 'kt'
  let mainActivityPattern, mainActivityReplacement
  if (fileExtension === 'java') {
    mainActivityPattern = 'public class MainActivity extends ReactActivity {'
    mainActivityReplacement = `
import android.os.Bundle;

public class MainActivity extends ReactActivity {

  /**
   * Required for react-navigation/native implementation
   * https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
   */
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
  }
`
  } else if (fileExtension === 'kt') {
    mainActivityPattern = 'class MainActivity : ReactActivity() {'
    mainActivityReplacement = `
import android.os.Bundle

class MainActivity : ReactActivity() {

  /**
   * Required for react-navigation/native implementation
   * https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
`
  }

  const mainActivityPath = `${fixtureDir}/android/app/src/main/java/com/reactnative/MainActivity.${fileExtension}`
  let mainActivityContents = fs.readFileSync(mainActivityPath, 'utf8')
  mainActivityContents = mainActivityContents.replace(mainActivityPattern, mainActivityReplacement)
  fs.writeFileSync(mainActivityPath, mainActivityContents)
}

function enableSourceMaps () {
  common.changeDir(`${ROOT_DIR}/scripts`)
  const initCommand = `./init-rn-cli.sh ${notifierVersion} ${reactNativeVersion} ${fixtureDir}`
  common.run(initCommand, true)
}
