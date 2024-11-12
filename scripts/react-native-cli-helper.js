// This script is designed to be run within the react-native-android-builder Docker image
// It copies just the files it needs from the source 'fixtures' directory in the destination,
// before running gradlew (to avoid the need to download gradle multiple times).
const common = require('./common')
const fs = require('fs')

module.exports = {
  buildAndroid: function buildAndroid (sourceFixturesIn, destFixturesIn) {
    try {
      const baseDir = process.env.PWD
      const sourceFixtures = `${baseDir}/${sourceFixturesIn}`
      const destFixtures = `${baseDir}/${destFixturesIn}`
      const version = process.env.NOTIFIER_VERSION || common.getCommitId()
      const rnVersion = process.env.REACT_NATIVE_VERSION

      console.log(`Installing CLI version: ${version}`)

      // Copy in files required from the host (just the Android ones)
      common.run(`mkdir -p ${destFixtures}/${rnVersion}`)
      common.run(`rsync -av --no-recursive ${sourceFixtures}/* ${destFixtures}`, true)
      common.run(`rsync -av --no-recursive ${sourceFixtures}/${rnVersion}/* ${destFixtures}/${rnVersion}`, true)
      common.run(`rsync -av ${sourceFixtures}/${rnVersion}/android ${destFixtures}/${rnVersion}`, true)

      // JavaScript layer
      common.changeDir(`${destFixtures}/${rnVersion}`)
      common.run('npm install', true)

      // Install and run the CLI
      const installCommand = `npm install @bugsnag/react-native-cli@${version}`
      common.run(installCommand, true)

      // Use Expect to run the init command interactively
      common.changeDir(`${destFixtures}`)
      const initCommand = `./rn-cli-init-android.sh ${version} ${rnVersion}`
      common.run(initCommand, true)

      // Use Perl to replace the Bugsnag start command to use a loaded configuration
      const applicationPath = 'android/app/src/main/java/com/reactnative/'
      common.changeDir(`${destFixtures}/${rnVersion}/${applicationPath}`)
      const perlCommand = 'perl -pi -e "s/Bugsnag.start\\(this\\);/Bugsnag.start\\(this, createConfiguration\\(\\)\\);/g" MainApplication.java'
      common.run(perlCommand, true)

      // Native layer
      common.changeDir(`${destFixtures}/${rnVersion}/android`)
      if (process.env.RN_NEW_ARCH) {
        common.run('./gradlew bugsnag_react-native:generateCodegenArtifactsFromSchema assembleRelease', true)
      } else {
        common.run('./gradlew assembleRelease', true)
      }

      common.changeDir(`${destFixtures}/${rnVersion}`)
      const bugsnagCliCommand = 'npm run bugsnag:upload-rn-android -- --overwrite'
      common.run(bugsnagCliCommand, true)

      // Finally, copy the APK back to the host
      common.run(`mkdir -p ${baseDir}/build`)
      fs.copyFileSync(`${destFixtures}/${rnVersion}/android/app/build/outputs/apk/release/app-release.apk`,
        `${baseDir}/build/${rnVersion}.apk`)
    } catch (e) {
      console.error(e, e.stack)
      process.exit(1)
    }
  },
  buildIOS: function buildIOS () {
    try {
      const version = process.env.NOTIFIER_VERSION || common.getCommitId()
      const rnVersion = process.env.REACT_NATIVE_VERSION
      const fixturesDir = 'features/fixtures'
      const targetDir = `${fixturesDir}/${rnVersion}`
      const initialDir = process.cwd()

      // We're not in docker so check RN version is set
      if (rnVersion === undefined) {
        throw new Error('REACT_NATIVE_VERSION environment variable must be set')
      }

      // JavaScript layer
      common.changeDir(`${targetDir}`)
      common.run('npm install', true)

      // Install and run the CLI
      const installCommand = `npm install @bugsnag/react-native-cli@${version}`
      common.run(installCommand, true)

      // Use Expect to run the init command interactively
      common.changeDir(`${initialDir}/${fixturesDir}`)
      common.run(`./rn-cli-init-ios.sh ${version} ${rnVersion}`, true)

      // Clean and build the archive
      common.changeDir(`${initialDir}/${fixturesDir}/${rnVersion}/ios`)
      common.run(`rm -rf ../${rnVersion}.xcarchive`, true)
      common.run('bundle install')
      common.run('bundle exec pod install || bundle exec pod install --repo-update', true)
      const buildCmd = `xcodebuild -workspace ${rnVersion}.xcworkspace -scheme ${rnVersion} -configuration Release -sdk iphoneos build`
      common.run(buildCmd, true)
      const archiveCmd = `xcrun xcodebuild -scheme "${rnVersion}" -workspace "${rnVersion}.xcworkspace" -configuration Release -archivePath "../${rnVersion}.xcarchive" -allowProvisioningUpdates archive`
      common.run(archiveCmd, true)

      common.changeDir(`${initialDir}/${fixturesDir}/${rnVersion}`)
      const bugsnagCliCommand = 'npm run bugsnag:upload-rn-ios -- --overwrite'
      common.run(bugsnagCliCommand, true)
    } catch (e) {
      console.error(e, e.stack)
      process.exit(1)
    }
  }
}
