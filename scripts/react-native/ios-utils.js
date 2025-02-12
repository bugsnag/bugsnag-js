const { execFileSync } = require('child_process')
const fs = require('fs')
const { resolve } = require('path')

module.exports = {
  configureIOSProject: function configureIOSProject (fixtureDir) {
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
  },
  buildIPA: function buildIPA( fixtureDir, exportArchive = true ) {
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

    // export the archive
    const exportArgs = [
      'xcodebuild',
      '-exportArchive',
      '-exportPath',
      'output/',
      '-exportOptionsPlist',
      'exportOptions.plist'
    ]

    if (exportArchive) {
      exportArgs.splice(3, 0, '-archivePath', 'reactnative.xcarchive')
    }

    execFileSync('xcrun', exportArgs, { cwd: fixtureDir, stdio: 'inherit' })
  }

}
