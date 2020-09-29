// This script is designed to be run within the react-native-android-builder Docker image
// It copies just the files it needs from the source 'fixtures' directory in the destination,
// before running gradlew (to avoid the need to download gradle multiple times).
const common = require('./common')
const fs = require('fs')
const path = require('path')

module.exports = {
  getRnDirectories: function getRnDirectories (within) {
    // Returns a list of path that look React Native test fixture folder under 'within'
    const isRnDirectory = source => fs.lstatSync(source).isDirectory() && source.match(/rn0\.[1-9][0-9]/)
    const getDirs = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isRnDirectory)
    return getDirs(within)
  },
  gather: function gather (fixtures, gatherDir) {
    // Used to gather the Gradle skeleton for each test fixture locally, for COPYing by the Dockerfile
    const target = path.resolve(gatherDir)
    console.log(`Gathering fixture files from ${fixtures}`)
    const rnDirs = this.getRnDirectories(fixtures)
    rnDirs.forEach((dir) => {
      const shortDir = path.relative(fixtures, dir)
      const copyTo = `${target}/${shortDir}/android/`
      common.run(`mkdir -p ${copyTo}`)
      common.run(`rsync -a ${dir}/android/gradle ${copyTo}`)
      common.run(`rsync ${dir}/android/build.gradle ${copyTo}`)
      common.run(`rsync ${dir}/android/gradle.properties ${copyTo}`)
      common.run(`rsync ${dir}/android/gradlew ${copyTo}`)
    })
  },
  prepare: function prepare (fixtures) {
    // Run 'gradlew' in each Android to force early download of Gradle
    const rnDirs = this.getRnDirectories(fixtures)
    rnDirs.forEach((dir) => {
      console.log(`Preparing Gradle builds for ${dir}`)
      common.changeDir(path.join(dir, 'android'))
      common.run('./gradlew build', true)
    })
  },
  buildAndroid: function buildAndroid (sourceFixtures, destFixtures) {
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
    common.run(`rsync -a ${sourceFixtures}/${rnVersion} ${destFixtures}`, true)
    common.run(`rsync -a ${sourceFixtures}/app/${jsSourceDir}/ ${destFixtures}/${rnVersion}`, true)
    common.run(`rsync -a ${sourceFixtures}/reactnative ${destFixtures}/${rnVersion}/android/app/src/main/java/com`, true)

    // JavaScript layer
    console.log(`Changing directory to: ${destFixtures}/${rnVersion}`)
    common.changeDir(`${destFixtures}/${rnVersion}`)
    common.run(`npm install --registry ${registryUrl}`, true)

    // Install notifier
    let command = `npm install @bugsnag/react-native@${version}  --registry ${registryUrl}`
    common.run(command, true)

    // Install navigation tracker
    command = `npm install @bugsnag/plugin-react-navigation@${version} --registry ${registryUrl}`
    common.run(command, true)

    // Install any required secondary files
    if (fs.existsSync('./install.sh')) {
      console.log('Installing secondary requirements')
      common.run('./install.sh', true)
    }

    // Native layer
    common.changeDir('android')
    common.run('./gradlew assembleRelease', true)

    // Finally, copy the APK back to the host
    fs.copyFileSync(`${destFixtures}/${rnVersion}/android/app/build/outputs/apk/release/app-release.apk`, `/app/build/${artefactName}.apk`)
  },
  buildIOS: function buildIOS () {
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
    common.run(`cp -r ${fixtureDir}/app/${jsSourceDir}/ ${targetDir}`, true)

    // JavaScript layer
    console.log(`Changing directory to: ${targetDir} and running "npm install"`)
    common.changeDir(`${targetDir}`)
    common.run(`npm install --registry ${registryUrl}`, true)

    // Install notifier
    console.log(`Installing notifier: ${version}`)
    let command = `npm install @bugsnag/react-native@${version}  --registry ${registryUrl}`
    common.run(command, true)

    // Install navigation trackers
    command = `npm install @bugsnag/plugin-react-navigation@${version} --registry ${registryUrl}`
    common.run(command, true)
    command = `npm install @bugsnag/plugin-react-native-navigation@${version} --registry ${registryUrl}`
    common.run(command, true)

    // Install any required secondary files
    if (fs.existsSync('./install.sh')) {
      common.run('./install.sh', true)
    }

    // Performing local build steps
    console.log('Locating local build script')
    if (!fs.existsSync('./build.sh')) {
      throw new Error('Local iOS build file at ./build.sh could not be found')
    }
    common.run('./build.sh', true)

    // Copy file out to build directory
    common.changeDir(initialDir)
    if (!fs.existsSync('build')) {
      common.run('mkdir build')
    }
    fs.copyFileSync(`${targetDir}/output/output.ipa`, `build/${artefactName}.ipa`)
  }
}
