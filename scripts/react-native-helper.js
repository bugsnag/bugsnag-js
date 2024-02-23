// This script is designed to be run within the react-native-android-builder Docker image
// It copies just the files it needs from the source 'fixtures' directory in the destination,
// before running gradlew (to avoid the need to download gradle multiple times).
const common = require('./common')
const fs = require('fs')

module.exports = {
  buildAndroid: function buildAndroid (sourceFixtures, destFixtures) {
    try {
      const version = process.env.NOTIFIER_VERSION || common.determineVersion()
      const rnVersion = process.env.REACT_NATIVE_VERSION
      const registryUrl = process.env.REGISTRY_URL

      let jsSourceDir = 'scenario_js'
      if (process.env.JS_SOURCE_DIR) {
        jsSourceDir = process.env.JS_SOURCE_DIR
      }

      let artefactName = rnVersion
      if (process.env.ARTEFACT_NAME) {
        artefactName = process.env.ARTEFACT_NAME
      }

      console.log(`Installing notifier version: ${version}`)

      // Copy in files required
      common.run(`mkdir -p ${destFixtures}/${rnVersion}`)
      common.run(`rsync -a --no-recursive ${sourceFixtures}/${rnVersion}/* ${destFixtures}/${rnVersion}`, true)
      common.run(`rsync -a ${sourceFixtures}/${rnVersion}/android ${destFixtures}/${rnVersion}`, true)
      common.run(`rsync -a ${sourceFixtures}/app/${jsSourceDir}/ ${destFixtures}/${rnVersion}`, true)
      common.run(`rsync -a ${sourceFixtures}/reactnative ${destFixtures}/${rnVersion}/android/app/src/main/java/com`, true)

      // JavaScript layer
      common.changeDir(`${destFixtures}/${rnVersion}`)
      common.run(`npm install --registry ${registryUrl}`, true)

      // Install notifier
      const command = `npm install @bugsnag/react-native@${version}  --registry ${registryUrl}`
      common.run(command, true)

      // Install any required secondary files
      if (fs.existsSync('./install.sh')) {
        console.log('Installing secondary requirements')
        common.run(`BUGSNAG_VERSION=${version} ./install.sh`, true)
      }

      // Native layer
      common.changeDir('android')

      if (process.env.RN_NEW_ARCH === 'true') {
        common.run('cp newarch.gradle.properties gradle.properties')
        common.run('./gradlew generateCodegenArtifactsFromSchema assembleRelease', true)
      } else {
        common.run('./gradlew assembleRelease', true)
      }

      // Finally, copy the APK back to the host
      fs.copyFileSync(`${destFixtures}/${rnVersion}/android/app/build/outputs/apk/release/app-release.apk`,
        `${process.env.PWD}/build/${artefactName}.apk`)
    } catch (e) {
      console.error(e, e.stack)
      process.exit(1)
    }
  },
  buildIOS: function buildIOS () {
    try {
      const version = process.env.NOTIFIER_VERSION || common.determineVersion()
      const rnVersion = process.env.REACT_NATIVE_VERSION
      const registryUrl = process.env.REGISTRY_URL
      const fixtureDir = 'test/react-native/features/fixtures'
      const targetDir = `${fixtureDir}/${rnVersion}`
      const initialDir = process.cwd()

      let jsSourceDir = 'scenario_js'
      if (process.env.JS_SOURCE_DIR) {
        jsSourceDir = process.env.JS_SOURCE_DIR
      }

      let artefactName = rnVersion
      if (process.env.ARTEFACT_NAME) {
        artefactName = process.env.ARTEFACT_NAME
      }

      // We're not in docker so check the above are set
      if (rnVersion === undefined || registryUrl === undefined) {
        throw new Error('Both REACT_NATIVE_VERSION and REGISTRY_URL environment variables must be set')
      }

      // Copy the JS code into the test fixture
      console.log(`Copying JS app data from ${fixtureDir}/app to ${targetDir}`)
      common.run(`rsync -a ${fixtureDir}/app/${jsSourceDir}/ ${targetDir}`, true)

      // JavaScript layer
      console.log(`Changing directory to: ${targetDir} and running "npm install"`)
      common.changeDir(`${targetDir}`)
      common.run(`npm install --registry ${registryUrl}`, true)

      // Install notifier
      console.log(`Installing notifier: ${version}`)
      const command = `npm install @bugsnag/react-native@${version}  --registry ${registryUrl}`
      common.run(command, true)

      // Install any required secondary files
      if (fs.existsSync('./install.sh')) {
        common.run(`BUGSNAG_VERSION=${version} ./install.sh`, true)
      }

      // Performing local build steps
      console.log('Locating local build script')
      if (!fs.existsSync('./build.sh')) {
        throw new Error('Local iOS build file at ./build.sh could not be found')
      }
      common.run('bundle install', true)
      common.run('./build.sh', true)

      // Copy file out to build directory
      common.changeDir(initialDir)
      if (!fs.existsSync('build')) {
        common.run('mkdir build')
      }
      fs.copyFileSync(`${targetDir}/output/output.ipa`, `build/${artefactName}.ipa`)
    } catch (e) {
      console.error(e, e.stack)
      process.exit(1)
    }
  }
}
