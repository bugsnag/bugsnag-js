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
  build: function build (sourceFixtures, destFixtures) {
    const version = process.env.NOTIFIER_VERSION || common.determineVersion()
    const rnVersion = process.env.REACT_NATIVE_VERSION
    const registryUrl = process.env.REGISTRY_URL

    console.log(`Installing notifier version: ${version}`)

    // Copy in files required
    common.run(`rsync -a ${sourceFixtures}/${rnVersion} ${destFixtures}`, true)
    common.run(`rsync -a ${sourceFixtures}/app ${destFixtures}/${rnVersion}`, true)
    common.run(`rsync -a ${sourceFixtures}/reactnative ${destFixtures}/${rnVersion}/android/app/src/main/java/com`, true)

    // JavaScript layer
    console.log(`Changing directory to: ${destFixtures}/${rnVersion}`)
    common.changeDir(`${destFixtures}/${rnVersion}`)
    common.run(`npm install --registry ${registryUrl}`, true)

    // Install notifier
    const command = `npm install @bugsnag/react-native@${version} --registry ${registryUrl}`
    common.run(command, true)

    // RN link (only needed <0.60)
    common.run('node_modules/.bin/react-native link', true)

    // Native layer
    common.changeDir('android')
    common.run('./gradlew assembleRelease', true)

    // Finally, copy the APK back to the host
    fs.copyFileSync(`${destFixtures}/${rnVersion}/android/app/build/outputs/apk/release/app-release.apk`, `/app/build/${rnVersion}.apk`)
  }
}
