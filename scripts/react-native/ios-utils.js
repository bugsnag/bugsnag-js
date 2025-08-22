const { execFileSync } = require('child_process')
const fs = require('fs')
const { resolve } = require('path')

module.exports = {
  configureIOSProject: function configureIOSProject (fixtureDir, reactNativeVersion) {
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
      if (!gemfileContents.includes('concurrent-ruby')) {
        gemfileContents += '\ngem \'concurrent-ruby\', \'<= 1.3.4\''
      }
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

    // Older RN versions require some additional setup
    if (parseFloat(reactNativeVersion) < 0.72) {
      // pin the ruby version and replace the gemfile
      if (fs.existsSync(resolve(fixtureDir, '.ruby-version'))) {
        fs.rmSync(resolve(fixtureDir, '.ruby-version'))
      }

      if (fs.existsSync(resolve(fixtureDir, 'Gemfile.lock'))) {
        fs.rmSync(resolve(fixtureDir, 'Gemfile.lock'))
      }

      const replacementFilesDir = resolve(__dirname, '../../test/react-native/features/fixtures/replacements/')
      fs.copyFileSync(resolve(replacementFilesDir, 'ios/Gemfile'), resolve(fixtureDir, 'Gemfile'))

      // bump the minimum iOS version to 13
      podfileContents = podfileContents.replace(/platform\s*:ios,\s*(?:'[\d.]+'|min_ios_version_supported)/, "platform :ios, '13.0'")

      // enable hermes
      podfileContents = podfileContents.replace(':hermes_enabled => flags[:hermes_enabled]', ':hermes_enabled => true')

      // fix boost issues - apply patch to fix the boost download url
      const applyPatch = ['apply', '--ignore-whitespace', resolve(replacementFilesDir, 'patches/react-native-boost.patch')]
      execFileSync('git', applyPatch, { cwd: fixtureDir, stdio: 'inherit' })

      // apply this build configuration to work around a boost issue in modern xcode versions: https://github.com/facebook/react-native/issues/37748#issuecomment-1580589448
      const boostPostInstallFix = `installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', '_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION']
      end
    end`

      const postInstallHook = 'post_install do |installer|\n'
      podfileContents = podfileContents.replace(postInstallHook, `${postInstallHook}    ${boostPostInstallFix}\n`)

      fs.writeFileSync(`${fixtureDir}/ios/Podfile`, podfileContents)
    }
  },
  buildIPA: function buildIPA (fixtureDir, exportArchive = true) {
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
      '-allowProvisioningUpdates',
      'archive'
    ]

    if (exportArchive) {
      archiveArgs.splice(8, 0, '-archivePath', `${fixtureDir}/reactnative.xcarchive`)
    }

    execFileSync('xcrun', archiveArgs, { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })

    if (exportArchive) {
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
  }

}
