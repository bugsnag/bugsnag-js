const { execFileSync, execSync } = require('child_process')
const { resolve } = require('path')
const fs = require('fs')

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

// Local Packages
const PACKAGE_DIRECTORIES = [
  `${ROOT_DIR}/packages/core`,
  `${ROOT_DIR}/packages/react-native`,
  `${ROOT_DIR}/packages/delivery-react-native`,
  `${ROOT_DIR}/packages/plugin-console-breadcrumbs`,
  `${ROOT_DIR}/packages/plugin-network-breadcrumbs`,
  `${ROOT_DIR}/packages/plugin-react`,
  `${ROOT_DIR}/packages/plugin-react-native-client-sync`,
  `${ROOT_DIR}/packages/plugin-react-native-event-sync`,
  `${ROOT_DIR}/packages/plugin-react-native-global-error-handler`,
  `${ROOT_DIR}/packages/plugin-react-native-hermes`,
  `${ROOT_DIR}/packages/plugin-react-native-session`,
  `${ROOT_DIR}/packages/plugin-react-native-unhandled-rejection`,
  `${ROOT_DIR}/packages/plugin-react-native-navigation`,
  `${ROOT_DIR}/packages/plugin-react-navigation`,
  `${ROOT_DIR}/test/react-native/features/fixtures/scenario-launcher`
]

const PEER_DEPENDENCIES = [
  'react-native-file-access@3.1.1'
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

const REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES = [
  'react-native-navigation'
]

if (!process.env.SKIP_BUILD_PACKAGES) {
  // run npm install in the root directory
  execFileSync('npm', ['install'], { cwd: ROOT_DIR, stdio: 'inherit' })

  // build the packages
  const buildArgs = ['run', 'build']
  execFileSync('npm', buildArgs, { cwd: ROOT_DIR, stdio: 'inherit' })
}

if (!process.env.SKIP_GENERATE_FIXTURE) {
  // remove the fixture directory if it already exists
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }

  // create the test fixture
  const RNInitArgs = ['@react-native-community/cli@latest', 'init', 'reactnative', '--directory', fixtureDir, '--version', reactNativeVersion, '--pm', 'npm', '--skip-install']
  execFileSync('npx', RNInitArgs, { stdio: 'inherit' })

  replaceGeneratedFixtureFiles()

  installFixtureDependencies()

  configureAndroidProject()

  configureIOSProject()

  // link react-native-navigation using rnn-link tool
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    execSync('npx rnn-link', { cwd: fixtureDir, stdio: 'inherit' })
  }
}

if (process.env.BUILD_ANDROID === 'true' || process.env.BUILD_ANDROID === '1') {
  // build the android app
  execFileSync('./gradlew', ['assembleRelease'], { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
  fs.copyFileSync(`${fixtureDir}/android/app/build/outputs/apk/release/app-release.apk`, `${fixtureDir}/reactnative.apk`)
}

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
  // pack all local packages into the fixture directory
  for (const package of PACKAGE_DIRECTORIES) {
    const libraryPackArgs = ['pack', package, '--pack-destination', fixtureDir]
    execFileSync('npm', libraryPackArgs, { cwd: ROOT_DIR, stdio: 'inherit' })
  }

  // add dependencies for react-native-navigation (wix)
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    PEER_DEPENDENCIES.push(...REACT_NATIVE_NAVIGATION_PEER_DEPENDENCIES)
  } else if (!isNewArchEnabled) {
    // add dependencies for @react-navigation
    PEER_DEPENDENCIES.push(...REACT_NAVIGATION_PEER_DEPENDENCIES)
  }

  const fixtureDependencyArgs = PEER_DEPENDENCIES.join(' ')

  // install test fixture dependencies and local packages
  execSync(`npm install --save ${fixtureDependencyArgs} *.tgz --legacy-peer-deps`, { cwd: fixtureDir, stdio: 'inherit' })
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
    fs.writeFileSync(gemfilePath, gemfileContents)
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
