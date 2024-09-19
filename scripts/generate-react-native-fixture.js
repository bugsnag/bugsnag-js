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

const notifierVersion = process.env.NOTIFIER_VERSION || common.determineVersion()

const reactNativeVersion = process.env.RN_VERSION
const ROOT_DIR = resolve(__dirname, '../')

const isNewArchEnabled = process.env.RCT_NEW_ARCH_ENABLED === 'true' || process.env.RCT_NEW_ARCH_ENABLED === '1'

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

const DEPENDENCIES = [
  'react-native-file-access@3.0.4',
  `@bugsnag/react-native@${notifierVersion}`,
  `@bugsnag/plugin-react-navigation@${notifierVersion}`,
  `@bugsnag/plugin-react-native-navigation@${notifierVersion}`
]

const REACT_NAVIGATION_DEPENDENCIES = [
  '@react-navigation/native',
  '@react-navigation/native-stack',
  'react-native-screens',
  'react-native-safe-area-context'
]

const REACT_NATIVE_NAVIGATION_DEPENDENCIES = [
  'react-native-navigation'
]

if (!process.env.SKIP_GENERATE_FIXTURE) {
  // remove the fixture directory if it already exists
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }

  // create the test fixture
  const RNInitArgs = ['@react-native-community/cli@latest', 'init', 'reactnative', '--directory', fixtureDir, '--version', reactNativeVersion, '--npm', '--skip-install']
  execFileSync('npx', RNInitArgs, { stdio: 'inherit' })

  replaceGeneratedFixtureFiles()

  installFixtureDependencies()

  // link react-native-navigation using rnn-link tool
  if (process.env.REACT_NATIVE_NAVIGATION === 'true' || process.env.REACT_NATIVE_NAVIGATION === '1') {
    execSync('npx rnn-link', { cwd: fixtureDir, stdio: 'inherit' })
  }
}

if (process.env.BUILD_ANDROID === 'true' || process.env.BUILD_ANDROID === '1') {
  if (isNewArchEnabled) {
    // If we're building with the new architecture, replace the gradle.properties file
    fs.copyFileSync(
      resolve(replacementFilesDir, 'android/newarch.gradle.properties'),
      resolve(fixtureDir, 'android/gradle.properties')
    )
  }

  // build the android app
  execFileSync('./gradlew', ['assembleRelease'], { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
  fs.copyFileSync(`${fixtureDir}/android/app/build/outputs/apk/release/app-release.apk`, `${fixtureDir}/reactnative.apk`)
}

if (process.env.BUILD_IOS === 'true' || process.env.BUILD_IOS === '1') {
  fs.rmSync(`${fixtureDir}/reactnative.xcarchive`, { recursive: true, force: true })

  // install pods
  execFileSync('pod', ['install'], { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })

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
    DEPENDENCIES.push(...REACT_NATIVE_NAVIGATION_DEPENDENCIES)
  } else if (!isNewArchEnabled) {
    // add dependencies for @react-navigation
    DEPENDENCIES.push(...REACT_NAVIGATION_DEPENDENCIES)
  }

  const fixtureDependencyArgs = DEPENDENCIES.join(' ')

  // install test fixture dependencies
  execSync(`npm install --save ${fixtureDependencyArgs} --registry ${process.env.REGISTRY_URL}`, { cwd: fixtureDir, stdio: 'inherit' })

  // install the scenario launcher package
  const scenarioLauncherPackage = `${ROOT_DIR}/test/react-native/features/fixtures/scenario-launcher`
  execSync(`npm pack ${scenarioLauncherPackage} --pack-destination ${fixtureDir}`, { cwd: ROOT_DIR, stdio: 'inherit' })
  execSync('npm install --save bugsnag-react-native-scenarios-1.0.0.tgz', { cwd: fixtureDir, stdio: 'inherit' })
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

  // replace the AndroidManifest.xml file with our own
  fs.copyFileSync(
    resolve(replacementFilesDir, 'android/AndroidManifest.xml'),
    resolve(fixtureDir, 'android/app/src/main/AndroidManifest.xml')
  )

  // replace the Info.plist file with our own
  fs.copyFileSync(
    resolve(replacementFilesDir, 'ios/Info.plist'),
    resolve(fixtureDir, 'ios/reactnative/Info.plist')
  )

  // copy the exportOptions.plist file
  fs.copyFileSync(
    resolve(replacementFilesDir, 'ios/exportOptions.plist'),
    resolve(fixtureDir, 'exportOptions.plist')
  )

  // update pbxproj
  let pbxProjContents = fs.readFileSync(`${fixtureDir}/ios/reactnative.xcodeproj/project.pbxproj`, 'utf8')
  pbxProjContents = pbxProjContents.replaceAll('org.reactjs.native.example', 'com.bugsnag.fixtures')

  fs.writeFileSync(`${fixtureDir}/ios/reactnative.xcodeproj/project.pbxproj`, pbxProjContents)

  // update Podfile
  let podfileContents = fs.readFileSync(`${fixtureDir}/ios/Podfile`, 'utf8')

  // use static frameworks (this fixes an issue with react-native-file-access on 0.75)
  if (parseFloat(reactNativeVersion) >= 0.75) {
    podfileContents = podfileContents.replace(/target 'reactnative' do/, 'use_frameworks! :linkage => :static\ntarget \'reactnative\' do')
  }

  // disable Flipper
  if (podfileContents.includes('use_flipper!')) {
    podfileContents = podfileContents.replace(/use_flipper!/, '# use_flipper!')
  } else if (podfileContents.includes(':flipper_configuration')) {
    podfileContents = podfileContents.replace(/:flipper_configuration/, '# :flipper_configuration')
  }

  fs.writeFileSync(`${fixtureDir}/ios/Podfile`, podfileContents)

  // react navigation setup
  if (!isNewArchEnabled) {
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
