// This script is designed to be run within the react-native-android-builder Docker image
// It copies just the files it needs from the source 'fixtures' directory in the destination,
// before running gradlew (to avoid the need to download gradle multiple times).
const common = require('./common')
const fs = require('fs')

module.exports = {
  installCli: function installCli() {
    const version = process.env.NOTIFIER_VERSION || common.determineVersion()
    const registryUrl = process.env.REGISTRY_URL

    console.log(`Installing CLI version: ${version}`)
    const installCommand = `npm install -g bugsnag-react-native-cli@${version} --registry ${registryUrl}`
    common.run(installCommand, true)
  },
  buildAndroid: function buildAndroid (sourceFixtures, destFixtures) {
    const rnVersion = process.env.REACT_NATIVE_VERSION

    // Copy in files required from the host (just the Android ones)
    common.run(`mkdir -p ${destFixtures}/${rnVersion}`)
    common.run(`rsync -a --no-recursive ${sourceFixtures}/${rnVersion}/* ${destFixtures}/${rnVersion}`, true)
    common.run(`rsync -a ${sourceFixtures}/${rnVersion}/android ${destFixtures}/${rnVersion}`, true)

    // JavaScript layer
    common.changeDir(`${destFixtures}/${rnVersion}`)
    common.run(`npm install`, true)

    // Install and run the CLI to integrate Bugsnag
    this.installCli()
    // TODO App will not build at present if init is run
    // const initCommand = './node-modules/bugsnag-react-native-cli/bin/react-native-cli init'
    // common.run(initCommand, true)

    // Native layer
    common.changeDir('android')
    common.run('./gradlew assembleRelease', true)

    // Finally, copy the APK back to the host
    fs.copyFileSync(`${destFixtures}/${rnVersion}/android/app/build/outputs/apk/release/app-release.apk`,
                    `${process.env.PWD}/build/${rnVersion}.apk`)
  },
  buildIOS: function buildIOS () {
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
    console.log(`Changing directory to: ${targetDir} and running "npm install"`)
    common.changeDir(`${targetDir}`)
    common.run(`npm install --registry ${registryUrl}`, true)

    // Install and run the CLI
    this.installCli()
    const installCommand = `npm install bugsnag-react-native-cli@${version} --registry ${registryUrl}`
    common.run(installCommand, true)
    // TODO Need to provide an answers file for the init command
    // const initCommand = './node_modules/bugsnag-react-native-cli/bin/cli init'
    // common.run(initCommand, true)

    // Performing local build steps
    common.changeDir(`${initialDir}/${fixturesDir}`)
    console.log('Locating local build script')
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
