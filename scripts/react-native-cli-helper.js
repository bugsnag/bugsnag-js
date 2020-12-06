// This script is designed to be run within the react-native-android-builder Docker image
// It copies just the files it needs from the source 'fixtures' directory in the destination,
// before running gradlew (to avoid the need to download gradle multiple times).
const common = require('./common')
const fs = require('fs')

module.exports = {
  buildAndroid: function buildAndroid (sourceFixtures, destFixtures) {
    const version = process.env.NOTIFIER_VERSION || common.determineVersion()
    const rnVersion = process.env.REACT_NATIVE_VERSION
    const registryUrl = process.env.REGISTRY_URL

    console.log(`Installing CLI version: ${version}`)

    // Copy in files required from the host (just the Android ones)
    common.run(`mkdir -p ${destFixtures}/${rnVersion}`)
    common.run(`rsync -av --no-recursive ${sourceFixtures}/* ${destFixtures}`, true)
    common.run(`rsync -av --no-recursive ${sourceFixtures}/${rnVersion}/* ${destFixtures}/${rnVersion}`, true)
    common.run(`rsync -av ${sourceFixtures}/${rnVersion}/android ${destFixtures}/${rnVersion}`, true)

    // JavaScript layer
    common.changeDir(`${destFixtures}/${rnVersion}`)
    common.run(`npm install --registry ${registryUrl}`, true)

    // Install and run the CLI
    const installCommand = `npm install bugsnag-react-native-cli@${version} --registry ${registryUrl}`
    common.run(installCommand, true)

    // Use Expect to run the init command interactively
    common.changeDir(`${destFixtures}`)
    const initCommand = `./rn-cli-init-android.sh ${version}`
    common.run(initCommand, true)

    // Native layer
    common.changeDir(`${destFixtures}/${rnVersion}/android`)
    common.run('./gradlew assembleRelease', true)

    // Finally, copy the APK back to the host
    fs.copyFileSync(`${destFixtures}/${rnVersion}/android/app/build/outputs/apk/release/app-release.apk`,
                    `${process.env.PWD}/build/${rnVersion}.apk`)
  },
  buildIOS: function buildIOS () {
    const version = process.env.NOTIFIER_VERSION || common.determineVersion()
    const rnVersion = process.env.REACT_NATIVE_VERSION
    const registryUrl = process.env.REGISTRY_URL
    const fixturesDir = 'test/react-native-cli/features/fixtures'
    const targetDir = `${fixturesDir}/${rnVersion}`
    const initialDir = process.cwd()

    // We're not in docker so check the above are set
    if (rnVersion === undefined || registryUrl === undefined) {
      throw new Error('Both REACT_NATIVE_VERSION and REGISTRY_URL environment variables must be set')
    }

    // JavaScript layer
    common.changeDir(`${targetDir}`)
    common.run(`npm install --registry ${registryUrl}`, true)

    // Install and run the CLI
    const installCommand = `npm install bugsnag-react-native-cli@${version} --registry ${registryUrl}`
    common.run(installCommand, true)

    // Use Expect to run the init command interactively
    common.changeDir(`${initialDir}/${fixturesDir}`)
    common.run(`./rn-cli-init-ios.sh ${version}`, true)

    // Performing local build steps
    if (!fs.existsSync('./build-ios.sh')) {
      throw new Error('Local iOS build file at ./build-ios.sh not found')
    }
    common.run(`./build-ios.sh ${rnVersion}`, true)

    // Copy file to build directory
    common.changeDir(initialDir)
    if (!fs.existsSync('build')) {
      common.run('mkdir build')
    }
    fs.copyFileSync(`${fixturesDir}/output/${rnVersion}.ipa`, `build/${rnVersion}.ipa`)
  }
}
