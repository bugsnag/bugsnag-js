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

const rnVersion = process.env.RN_VERSION
const ROOT_DIR = resolve(__dirname, '../')

let fixturePath = 'test/react-native/features/fixtures/generated/'
if (process.env.RCT_NEW_ARCH_ENABLED === '1') {
  fixturePath += 'new-arch/'
} else {
  fixturePath += 'old-arch/'
}

const fixtureDir = resolve(ROOT_DIR, fixturePath, rnVersion)

const replacementFilesDir = resolve(ROOT_DIR, 'test/react-native/features/fixtures/app/dynamic/')

const DEPENDENCIES = [
  'react-native-file-access@3.0.4'
]

if (!process.env.SKIP_GENERATE_FIXTURE) {
  // remove the fixture directory if it already exists
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }

  // create the test fixture
  const RNInitArgs = [`react-native@${process.env.RN_VERSION}`, 'init', 'reactnative', '--directory', fixtureDir, '--version', rnVersion, '--npm', '--skip-install']
  execFileSync('npx', RNInitArgs, { stdio: 'inherit' })

  // replace the App.js/App.tsx file with our own App.js file
  fs.readdirSync(resolve(fixtureDir))
    .filter((file) => /App\.[tj]sx?$/.test(file))
    .map((file) => fs.unlinkSync(resolve(fixtureDir, file)))

  fs.copyFileSync(
    resolve(replacementFilesDir, 'App.js'),
    resolve(fixtureDir, 'App.js')
  )

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

  // use static frameworks (this is required to use bugsnag-cocoa from the scenarios package)
  let podfileContents = fs.readFileSync(`${fixtureDir}/ios/Podfile`, 'utf8')
  podfileContents = podfileContents.replace(/target 'reactnative' do/, 'use_frameworks! :linkage => :static\ntarget \'reactnative\' do')

  // disable Flipper
  if (podfileContents.includes('use_flipper!')) {
    podfileContents = podfileContents.replace(/use_flipper!/, '# use_flipper!')
  } else if (podfileContents.includes(':flipper_configuration')) {
    podfileContents = podfileContents.replace(/:flipper_configuration/, '# :flipper_configuration')
  }

  fs.writeFileSync(`${fixtureDir}/ios/Podfile`, podfileContents)

  const fixtureDependencyArgs = DEPENDENCIES.join(' ')

  // install test fixture dependencies and local packages
  execSync(`npm install --save ${fixtureDependencyArgs}`, { cwd: fixtureDir, stdio: 'inherit' })

  // install @bugsnag/react-native from the registry
  execSync(`npm install --save @bugsnag/react-native@${notifierVersion} --registry ${process.env.REGISTRY_URL}`, { cwd: fixtureDir, stdio: 'inherit' })

  // install the scenario launcher package
  const scenarioLauncherPackage = `${ROOT_DIR}/test/react-native/features/fixtures/scenario-launcher`
  execSync(`npm pack ${scenarioLauncherPackage} --pack-destination ${fixtureDir}`, { cwd: ROOT_DIR, stdio: 'inherit' })
  execSync('npm install --save bugsnag-react-native-scenarios-1.0.0.tgz', { cwd: fixtureDir, stdio: 'inherit' })
}

if (process.env.BUILD_ANDROID === 'true' || process.env.BUILD_ANDROID === '1') {
  if (process.env.RCT_NEW_ARCH_ENABLED === 'true' || process.env.RCT_NEW_ARCH_ENABLED === '1') {
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

  // bundle install
  execFileSync('bundle', ['install'], { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })

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
