// This script is designed to be run within the react-native-android-builder Docker image
// It copies just the files it needs from the source 'fixtures' directory in the destination,
// before running gradlew (to avoid the need to download gradle multiple times).
const common = require('./common')
const fs = require('fs')

module.exports = {
  buildAndroid: function buildAndroid (sourceFixturesIn, destFixturesIn) {
    const baseDir = process.env.PWD
    const sourceFixtures = `${baseDir}/${sourceFixturesIn}`
    const destFixtures = `${baseDir}/${destFixturesIn}`
    const version = process.env.NOTIFIER_VERSION || common.determineVersion()
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
    const installCommand = `npm install bugsnag-react-native-cli@${version}`
    common.run(installCommand, true)

    // Use Expect to run the init command interactively
    common.changeDir(`${destFixtures}`)
    const initCommand = `./rn-cli-init-android.sh ${version} ${rnVersion}`
    common.run(initCommand, true)

    // Native layer
    common.changeDir(`${destFixtures}/${rnVersion}/android`)
    common.run('./gradlew assembleRelease', true)

    // Finally, copy the APK back to the host
    fs.copyFileSync(`${destFixtures}/${rnVersion}/android/app/build/outputs/apk/release/app-release.apk`,
                    `${baseDir}/build/${rnVersion}.apk`)
  },
  buildIOS: function buildIOS () {
    const version = process.env.NOTIFIER_VERSION || common.determineVersion()
    const rnVersion = process.env.REACT_NATIVE_VERSION
    const fixturesDir = 'test/react-native-cli/features/fixtures'
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
    const installCommand = `npm install bugsnag-react-native-cli@${version}`
    common.run(installCommand, true)

    // Use Expect to run the init command interactively
    common.changeDir(`${initialDir}/${fixturesDir}`)
    common.run(`./rn-cli-init-ios.sh ${version} ${rnVersion}`, true)

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
