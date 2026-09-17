const { execFileSync } = require('child_process')
const fs = require('fs')
const { resolve } = require('path')

const BOOST_PODSPEC_PATH = ['node_modules', 'react-native', 'third-party-podspecs', 'boost.podspec']
const BOOST_GCS_BUCKET = 'bugsnag-platforms-dependencies'
const BOOST_GCS_OBJECT = 'boost/1.76.0/source/boost_1_76_0.tar.bz2'
const BOOST_SIGNED_URL_TTL_MS = 15 * 60 * 1000

async function getBoostSignedUrl () {
  if (process.env.BOOST_SIGNED_URL) {
    return process.env.BOOST_SIGNED_URL
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return null
  }

  // Lazy-load @google-cloud/storage after npm ci has executed
  const { Storage } = require('@google-cloud/storage')
  const storage = new Storage()
  const bucketName = process.env.BOOST_GCS_BUCKET || BOOST_GCS_BUCKET
  const objectName = process.env.BOOST_GCS_OBJECT || BOOST_GCS_OBJECT
  const [signedUrl] = await storage.bucket(bucketName).file(objectName).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + BOOST_SIGNED_URL_TTL_MS
  })

  return signedUrl
}

async function rewriteBoostPodspecSource (fixtureDir) {
  const podspecPath = resolve(fixtureDir, ...BOOST_PODSPEC_PATH)

  if (!fs.existsSync(podspecPath)) {
    return
  }

  let podspecContents = fs.readFileSync(podspecPath, 'utf8')

  // Only rewrite if this fixture uses Boost 1.76.0 (RN <= 0.72)
  if (!podspecContents.includes('1.76.0')) {
    return
  }

  const boostSignedUrl = await getBoostSignedUrl()

  if (!boostSignedUrl) {
    throw new Error(
      'Boost 1.76.0 requires GCS credentials to download from internal storage. ' +
      'Please ensure GOOGLE_APPLICATION_CREDENTIALS or BOOST_SIGNED_URL is set.'
    )
  }

  // Replace the existing source HTTP URL strictly with the GCS signed URL
  podspecContents = podspecContents.replace(
    /(:\s*http\s*=>\s*['"])[^'"]+(['"])/g,
    function (_, prefix, suffix) { return prefix + boostSignedUrl + suffix }
  )

  // Ensure checksum matches the internal GCS archive
  podspecContents = podspecContents.replace(
    /71c32f4085e3adef4fffc90674a01079665d281d1de2aea6c6955db8567deae1/g,
    'f0397ba6e982c4450f27bf32a2a83292aba035b827a5623a14636ea583318c41'
  )

  fs.writeFileSync(podspecPath, podspecContents)
}

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

    // pin xcodeproj, concurrent-ruby, and json versions in Gemfile
    const gemfilePath = resolve(fixtureDir, 'Gemfile')
    if (fs.existsSync(gemfilePath)) {
      let gemfileContents = fs.readFileSync(gemfilePath, 'utf8')
      if (!gemfileContents.includes('xcodeproj')) {
        gemfileContents += '\ngem \'xcodeproj\', \'< 1.26.0\''
      }
      if (!gemfileContents.includes('concurrent-ruby')) {
        gemfileContents += '\ngem \'concurrent-ruby\', \'<= 1.3.4\''
      }
      if (!gemfileContents.includes('json')) {
        gemfileContents += '\ngem \'json\', \'< 2.7\''
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
    if (parseFloat(reactNativeVersion) <= 0.72) {
      // pin the ruby version and replace the gemfile
      if (fs.existsSync(resolve(fixtureDir, '.ruby-version'))) {
        fs.rmSync(resolve(fixtureDir, '.ruby-version'))
      }

      if (fs.existsSync(resolve(fixtureDir, 'Gemfile.lock'))) {
        fs.rmSync(resolve(fixtureDir, 'Gemfile.lock'))
      }

      const replacementFilesDir = resolve(__dirname, '../../test/react-native/features/fixtures/replacements/')
      fs.copyFileSync(resolve(replacementFilesDir, 'ios/Gemfile'), resolve(fixtureDir, 'Gemfile'))

      // RN 0.72 fixtures generated by newer CLI templates can include a
      // `quirks_mode` option that older react_native_pods helpers do not accept.
      // Matches both with or without trailing commas and inline placements.
      podfileContents = podfileContents
        .replace(/^\s*(?::)?quirks_mode\s*(?:=>|:)\s*.*,?\s*$\n?/gm, '')
        .replace(/,?\s*(?::)?quirks_mode\s*(?:=>|:)\s*[^,\n)]+/g, '')

      // bump the minimum iOS version to 13
      podfileContents = podfileContents.replace(/platform\s*:ios,\s*(?:'[\d.]+'|min_ios_version_supported)/, "platform :ios, '13.0'")

      // enable hermes
      podfileContents = podfileContents.replace(':hermes_enabled => flags[:hermes_enabled]', ':hermes_enabled => true')

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
  buildIPA: async function buildIPA (fixtureDir, exportArchive = true) {
    await rewriteBoostPodspecSource(fixtureDir)
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